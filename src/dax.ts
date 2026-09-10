/** Deliberately bounded DAX teaching interpreter. No eval, Power BI, XMLA or external calls. */
import type {Fixtures,Graph,Row} from './types.js';
export const DAX_SUPPORT='SUM, SUMX, COUNTROWS, DISTINCTCOUNT, DIVIDE, CALCULATE with Country/Category equality, arithmetic, and [Revenue], [Cost], [Gross Profit]. Only the supplied teaching model is supported.';
type Ast={kind:'number';value:number}|{kind:'string';value:string}|{kind:'column';table:string;column:string}|{kind:'measure';name:string}|{kind:'table';name:string}|{kind:'call';name:string;args:Ast[]}|{kind:'binary';op:string;left:Ast;right:Ast};
type Token={type:string;text:string};
function tokenize(text:string):Token[]{
  if(text.length>10000)throw new Error('The DAX preview is limited to 10,000 characters.');
  const tokens:Token[]=[];let i=0;
  while(i<text.length){const rest=text.slice(i);if(/^\s/.test(rest)){i++;continue;}if(rest.startsWith('//')||rest.startsWith('--')){const end=text.indexOf('\n',i);i=end<0?text.length:end;continue;}
    let m:RegExpExecArray|null;
    if((m=/^\d+(?:\.\d+)?/.exec(rest))){tokens.push({type:'number',text:m[0]});i+=m[0].length;}
    else if((m=/^"((?:[^"]|"")*)"/.exec(rest))){tokens.push({type:'string',text:m[1].replace(/""/g,'"')});i+=m[0].length;}
    else if((m=/^\[([^\]]+)\]/.exec(rest))){tokens.push({type:'bracket',text:m[1]});i+=m[0].length;}
    else if((m=/^[A-Za-z_][A-Za-z0-9_]*/.exec(rest))){tokens.push({type:'word',text:m[0]});i+=m[0].length;}
    else if('()+-*/,='.includes(text[i])){tokens.push({type:text[i],text:text[i]});i++;}
    else throw new Error(`Unsupported DAX syntax near: ${rest.slice(0,30)}. This is a teaching subset, not a full DAX engine.`);
    if(tokens.length>1000)throw new Error('Expression is too complex for this preview.');
  }
  return tokens;
}
export function parseDax(text:string):{ast:Ast;name:string}{
  const clean=text.trim();const assignment=/^([A-Za-z][A-Za-z0-9_ ]*)\s*=/.exec(clean);
  const name=assignment?.[1].trim()??'Preview';const tokens=tokenize(assignment?clean.slice(assignment[0].length):clean);let pos=0,depth=0;
  const peek=()=>tokens[pos],take=()=>tokens[pos++];
  const expect=(type:string)=>{if(take()?.type!==type)throw new Error(`Expected ${type} in the DAX expression.`);};
  function primary():Ast{
    if(++depth>40)throw new Error('DAX nesting exceeds the teaching limit.');
    const t=take();let a:Ast;
    if(!t)throw new Error('The expression is incomplete.');
    if(t.type==='number')a={kind:'number',value:Number(t.text)};
    else if(t.type==='string')a={kind:'string',value:t.text};
    else if(t.type==='bracket')a={kind:'measure',name:t.text};
    else if(t.type==='-')a={kind:'binary',op:'*',left:{kind:'number',value:-1},right:primary()};
    else if(t.type==='('){a=expression(0);expect(')');}
    else if(t.type==='word'){
      if(peek()?.type==='bracket')a={kind:'column',table:t.text,column:take().text};
      else if(peek()?.type==='('){take();const args:Ast[]=[];if(peek()?.type!==')'){do{args.push(expression(0));if(peek()?.type!==',')break;take();}while(true);}expect(')');a={kind:'call',name:t.text.toUpperCase(),args};}
      else a={kind:'table',name:t.text};
    }else throw new Error(`Unexpected token ${t.text}.`);
    depth--;return a;
  }
  function expression(min:number):Ast{
    let left=primary();const precedence:Record<string,number>={'=':1,'+':2,'-':2,'*':3,'/':3};
    while(peek()&&precedence[peek().type]!==undefined&&precedence[peek().type]>=min){const op=take().text;const right=expression(precedence[op]+1);left={kind:'binary',op,left,right};}return left;
  }
  const ast=expression(0);if(pos!==tokens.length)throw new Error(`Unexpected token ${tokens[pos].text}.`);return {ast,name};
}
export interface FilterContext{country:string;category:string;}
type Value=number|string|boolean|null;
export function visibleRows(table:string,data:Fixtures,graph:Graph,ctx:FilterContext):Row[]{
  const tableName=Object.keys(data).find(k=>k.toLowerCase()===table.toLowerCase());if(!tableName)throw new Error(`Unknown table ${table}.`);
  const rows=data[tableName].rows;
  if(tableName==='DimCustomer')return rows.filter(r=>ctx.country==='All'||r.Country===ctx.country);
  if(tableName==='DimProduct')return rows.filter(r=>ctx.category==='All'||r.Category===ctx.category);
  if(tableName!=='Sales')throw new Error('The DAX teaching preview supports only Sales, DimCustomer and DimProduct.');
  const customerActive=graph.edges.some(e=>e.from==='customer'&&e.to==='sales'&&e.active!==false);
  const productActive=graph.edges.some(e=>e.from==='product'&&e.to==='sales'&&e.active!==false);
  const customers=new Set(visibleRows('DimCustomer',data,graph,ctx).map(r=>r.CustomerKey));
  const products=new Set(visibleRows('DimProduct',data,graph,ctx).map(r=>r.ProductKey));
  return rows.filter(r=>(!customerActive||customers.has(r.CustomerKey))&&(!productActive||products.has(r.ProductKey)));
}
export function evaluateDax(code:string,data:Fixtures,graph:Graph,context:FilterContext):{name:string;value:number|null;rowCount:number}{
  const {ast,name}=parseDax(code);const baseMeasures:Record<string,string>={revenue:'SUMX(Sales, Sales[Quantity] * Sales[UnitPrice])',cost:'SUMX(Sales, Sales[Quantity] * Sales[UnitCost])','gross profit':'[Revenue] - [Cost]'};
  const numeric=(value:Value):number=>{if(value===null)return 0;if(typeof value!=='number')throw new Error('A numeric expression was expected.');return value;};
  const colValue=(row:Row,column:string):Value=>{const key=Object.keys(row).find(k=>k.toLowerCase()===column.toLowerCase());if(!key)throw new Error(`Unknown column ${column}.`);return row[key];};
  function run(a:Ast,ctx:FilterContext,row?:Row,table?:string,stack:string[]=[]):Value{
    if(a.kind==='number'||a.kind==='string')return a.value;
    if(a.kind==='table')throw new Error('A table cannot be used as a scalar value.');
    if(a.kind==='column'){if(!row||table?.toLowerCase()!==a.table.toLowerCase())throw new Error('A column needs row context: use SUM or SUMX.');return colValue(row,a.column);}
    if(a.kind==='measure'){
      const key=a.name.toLowerCase();if(key===name.toLowerCase()||stack.includes(key))throw new Error('Circular measure reference in this teaching expression.');
      if(!baseMeasures[key])throw new Error(`Unknown measure [${a.name}]. Only Revenue, Cost and Gross Profit are provided.`);
      if(row)throw new Error('Measure references inside iterators require context transition, which this teaching subset does not implement.');
      return run(parseDax(baseMeasures[key]).ast,ctx,undefined,undefined,[...stack,key]);
    }
    if(a.kind==='binary'){
      const l=run(a.left,ctx,row,table,stack),r=run(a.right,ctx,row,table,stack);
      if(a.op==='=')return l===r;
      if(a.op==='*'&&(l===null||r===null))return null;
      if(a.op==='+')return l===null&&r===null?null:numeric(l)+numeric(r);
      if(a.op==='-')return l===null&&r===null?null:numeric(l)-numeric(r);
      if(a.op==='*')return numeric(l)*numeric(r);
      if(numeric(r)===0)throw new Error('Division by zero in teaching preview. Use DIVIDE to define a blank or alternate result.');
      return numeric(l)/numeric(r);
    }
    const args=a.args,arity=(lo:number,hi=lo)=>{if(args.length<lo||args.length>hi)throw new Error(`${a.name} expects ${lo}${hi!==lo?` to ${hi}`:''} arguments.`);};
    if(a.name==='SUM'||a.name==='DISTINCTCOUNT'){
      arity(1);const col=args[0];if(col.kind!=='column')throw new Error(`${a.name} requires a column reference.`);
      const values=visibleRows(col.table,data,graph,ctx).map(r=>colValue(r,col.column));
      if(!values.length)return null;
      return a.name==='DISTINCTCOUNT'?new Set(values).size:values.every(v=>v===null)?null:values.reduce<number>((s,v)=>s+numeric(v),0);
    }
    if(a.name==='COUNTROWS'){arity(1);if(args[0].kind!=='table')throw new Error('COUNTROWS needs a table.');const count=visibleRows(args[0].name,data,graph,ctx).length;return count||null;}
    if(a.name==='SUMX'){arity(2);if(args[0].kind!=='table')throw new Error('SUMX needs a table as its first argument.');const tableName=args[0].name,rows=visibleRows(tableName,data,graph,ctx);if(!rows.length)return null;const values=rows.map(r=>run(args[1],ctx,r,tableName,stack));return values.every(v=>v===null)?null:values.reduce<number>((s,v)=>s+numeric(v),0);}
    if(a.name==='DIVIDE'){arity(2,3);const numerator=run(args[0],ctx,row,table,stack),denominator=run(args[1],ctx,row,table,stack);if(numeric(denominator)===0)return args[2]?run(args[2],ctx,row,table,stack):null;if(numerator===null)return null;return numeric(numerator)/numeric(denominator);}
    if(a.name==='CALCULATE'){
      arity(2,3);if(row)throw new Error('CALCULATE inside row context is outside this teaching subset.');const next={...ctx};
      for(const filter of args.slice(1)){
        if(filter.kind!=='binary'||filter.op!=='='||filter.left.kind!=='column'||filter.right.kind!=='string')throw new Error('Only simple dimension equality filters are supported in CALCULATE.');
        const key=`${filter.left.table}[${filter.left.column}]`.toLowerCase();
        if(key==='dimcustomer[country]')next.country=filter.right.value;
        else if(key==='dimproduct[category]')next.category=filter.right.value;
        else throw new Error('CALCULATE filters support DimCustomer[Country] and DimProduct[Category] only.');
      }
      return run(args[0],next,undefined,undefined,stack);
    }
    throw new Error(`${a.name} is not implemented in the teaching subset. This does not mean your real DAX is invalid.`);
  }
  const value=run(ast,context);if(value!==null&&(typeof value!=='number'||!Number.isFinite(value)))throw new Error('The measure must return a finite number or BLANK in this preview.');
  return {name,value:value as number|null,rowCount:visibleRows('Sales',data,graph,context).length};
}
