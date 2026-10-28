/* Shared model data for the calculator and the pages built on it.
   Rates are USD per 1M tokens: i input, c cached input (cache read), o output, w context window in tokens.
   Hand-maintained mirror of models.json. `node check-math.js` fails if the two disagree, and if any page
   still carries its own copy. Loaded with a same-origin script tag, which the CSP allows as 'self'. */
const MODELS=[
 {id:"gpt-6-astra",   p:"OpenAI",   n:"GPT-6 Astra",     i:10.00, c:1.00,   o:50.00, w:1050000},
 {id:"gpt-6-1-sol",   p:"OpenAI",   n:"GPT-6.1 Sol",     i:2.00,  c:0.10,   o:10.00, w:1050000},
 {id:"gpt-6-1-terra", p:"OpenAI",   n:"GPT-6.1 Terra",   i:1.00,  c:0.05,   o:5.00, w:1050000},
 {id:"gpt-6-luna",    p:"OpenAI",   n:"GPT-6 Luna",      i:0.10,  c:0.01,   o:0.50, w:1050000},
 {id:"gpt-5-6-sol",   p:"OpenAI",   n:"GPT-5.6 Sol",     i:4.00,  c:0.40,   o:20.00, w:1050000},
 {id:"gpt-5-6-terra", p:"OpenAI",   n:"GPT-5.6 Terra",   i:2.00,  c:0.20,   o:12.00, w:1050000},
 {id:"gpt-5-6-luna",  p:"OpenAI",   n:"GPT-5.6 Luna",    i:0.20,  c:0.02,   o:1.20, w:1050000},
 {id:"fable-5-1",     p:"Anthropic",n:"Claude Fable 5.1",i:10.00, c:0.25,   o:50.00, w:1000000},
 {id:"opus-5-5",      p:"Anthropic",n:"Claude Opus 5.5", i:4.00,  c:0.20,   o:20.00, w:1000000},
 {id:"sonnet-5-5",    p:"Anthropic",n:"Claude Sonnet 5.5",i:2.00, c:0.10,   o:10.00, w:1000000},
 {id:"fable-5",       p:"Anthropic",n:"Claude Fable 5",  i:10.00, c:1.00,   o:50.00, w:1000000},
 {id:"opus-5",        p:"Anthropic",n:"Claude Opus 5",   i:5.00,  c:0.50,   o:25.00, w:1000000},
 {id:"sonnet-5",      p:"Anthropic",n:"Claude Sonnet 5", i:2.00,  c:0.20,   o:10.00, w:1000000},
 {id:"haiku-5-5",     p:"Anthropic",n:"Claude Haiku 5.5",i:0.10,  c:0.01,   o:0.50, w:1000000},
 {id:"haiku-4-5",     p:"Anthropic",n:"Claude Haiku 4.5",i:1.00,  c:0.10,   o:5.00, w:200000},
 {id:"gemini-4-argon",p:"Google",   n:"Gemini 4 Argon",  i:2.00,  c:0.10,   o:10.00, w:1048576},
 {id:"gemini-3-1-pro",p:"Google",   n:"Gemini 3.1 Pro",  i:2.00,  c:0.20,   o:12.00, w:1048576},
 {id:"gemini-3-8-fl", p:"Google",   n:"Gemini 3.8 Flash",i:0.75,  c:0.075,  o:3.75, w:1048576},
 {id:"gemini-3-7-fl", p:"Google",   n:"Gemini 3.7 Flash (routed to 3.8)",i:0.75,  c:0.075,  o:3.75, w:1048576},
 {id:"gemini-3-6-fl", p:"Google",   n:"Gemini 3.6 Flash",i:0.75,  c:0.075,  o:3.75, w:1048576},
 {id:"gemini-2-5-pro",p:"Google",   n:"Gemini 2.5 Pro",  i:1.25,  c:0.125,  o:10.00, w:1048576},
 {id:"grok-4-7",      p:"xAI",      n:"Grok 4.7",        i:2.00,  c:0.50,   o:6.00, w:500000},
 {id:"grok-4-6",      p:"xAI",      n:"Grok 4.6",        i:2.00,  c:0.50,   o:6.00, w:500000},
 {id:"grok-4-5",      p:"xAI",      n:"Grok 4.5",        i:2.00,  c:0.30,   o:6.00, w:500000},
 {id:"grok-4-3",      p:"xAI",      n:"Grok 4.3",        i:1.25,  c:0.20,   o:2.50, w:1000000},
 {id:"muse-wonder-1-0",p:"Meta",    n:"Muse Wonder 1.0", i:4.00,  c:0.20,   o:20.00, w:1048576},
 {id:"muse-spark-1-3",p:"Meta",     n:"Muse Spark 1.3",  i:1.25,  c:0.15,   o:4.25, w:1048576},
 {id:"kimi-k3-1-pro", p:"Moonshot", n:"Kimi K3.1 Pro",   i:2.00,  c:0.20,   o:10.00, w:1048576},
 {id:"kimi-k3",       p:"Moonshot", n:"Kimi K3",         i:3.00,  c:0.30,   o:15.00, w:1048576},
 {id:"deepseek-v4-pro",p:"DeepSeek",n:"DeepSeek V4 Pro", i:1.32,  c:0.044,  o:3.96, w:1000000},
 {id:"deepseek-v4-fl",p:"DeepSeek", n:"DeepSeek V4.1 Flash",i:0.30, c:0.006, o:1.20, w:1000000}
];

/* same loop as the main calculator, standard rates, no batch and no cache-write charge */
function costPerRun(m,p){
  let total=0;
  for(let i=1;i<=p.N;i++){
    const ctx=p.S+p.U+(i-1)*(p.O+p.T), cached=ctx*p.C, fresh=ctx-cached;
    total+=(cached*m.c + fresh*m.i + p.O*m.o)/1e6;
  }
  return total*(1+p.R);
}
const fits=(m,p)=> p.S+p.U+(p.N-1)*(p.O+p.T)+p.O<=m.w;
