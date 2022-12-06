import re

entradaLog = open("entradaLog", "r")
entradaLogList = list(entradaLog)

commit = re.compile(r'commit', re.IGNORECASE)
start = re.compile(r'start', re.IGNORECASE)
startckpt = re.compile(r'start ckpt', re.IGNORECASE)
endckpt = re.compile(r'end ckpt', re.IGNORECASE)
extract = re.compile(r'(?!commit\b)(?!CKPT\b)(?!Start\b)\b\w+', re.IGNORECASE)
words = re.compile(r'\w+', re.IGNORECASE)

valores = words.findall(entradaLogList[0])
variaveis = {}

for i in range(0,len(valores),2):
  variaveis[valores[i]]= valores[i+1]

print("", valores)
print('', variaveis)

entradaLog.close()