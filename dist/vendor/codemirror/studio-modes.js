/* Original CodeDELeet lightweight lexical modes; not semantic validators. */
(function(CM){
CM.defineSimpleMode('studio-dax',{start:[{regex:/\/\/.*|--.*/,token:'comment'},{regex:/"(?:[^"\\]|\\.)*"/,token:'string'},{regex:/\b(?:SUMX|SUM|COUNTROWS|DISTINCTCOUNT|DIVIDE|CALCULATE|FILTER|ALL|VALUES|VAR|RETURN|IF|TRUE|FALSE|BLANK)\b/i,token:'keyword'},{regex:/\[[^\]]*\]/,token:'property'},{regex:/\b\d+(?:\.\d+)?\b/,token:'number'},{regex:/[+\-*\/=]/,token:'operator'}],meta:{lineComment:'//'}});
CM.defineSimpleMode('studio-hcl',{start:[{regex:/#.*/ ,token:'comment'},{regex:/\/\/.*/,token:'comment'},{regex:/"(?:[^"\\]|\\.)*"/,token:'string'},{regex:/\b(?:resource|variable|output|locals|provider|terraform|data|module|lifecycle|true|false|null)\b/,token:'keyword'},{regex:/\b\d+(?:\.\d+)?\b/,token:'number'},{regex:/[{}\[\]]/,token:'bracket'},{regex:/[=+\-*\/]/,token:'operator'}],meta:{lineComment:'#'}});
})(CodeMirror);
