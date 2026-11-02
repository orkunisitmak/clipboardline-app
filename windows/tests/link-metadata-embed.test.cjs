'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {linkMetadata}=require('../lib/network.cjs');

test('YouTube link previews retain a usable host title on missing or malformed oEmbed data',async()=>{
 for(const payload of [null,{},[],true,{title:'   ',author_name:'',thumbnail_url:''}]){
  const metadata=await linkMetadata('https://youtu.be/synthetic',async()=>({bytes:Buffer.from(JSON.stringify(payload)),type:'application/json'}));
  assert.equal(metadata.title,'youtu.be');
  assert.equal(metadata.author,'');
  assert.equal(metadata.thumbnail,'');
 }
});

test('a valid YouTube oEmbed title and author still render normally',async()=>{
 const response=await linkMetadata('https://music.youtube.com/watch?v=synthetic',async()=>({bytes:Buffer.from(JSON.stringify({title:'Example video',author_name:'Example author',thumbnail_url:'https://i.ytimg.com/vi/synthetic/default.jpg'}))}));
 assert.deepEqual(response,{title:'Example video',author:'Example author',thumbnail:'https://i.ytimg.com/vi/synthetic/default.jpg'});
});

test('meta tags inside comments, scripts and styles do not supply the preview title or image',async()=>{
 const page=html=>linkMetadata('https://example.com/a',async()=>({bytes:Buffer.from(html),url:'https://example.com/a',type:'text/html'}));
 const fake='<meta property="og:title" content="Fake"><meta property="og:image" content="https://example.com/fake.png">';
 for(const wrapper of ['<!--'+fake+'-->','<script>var s=\''+fake+'\';</script>','<style>/* '+fake+' */</style>']){
  assert.deepEqual(await page(wrapper+'<title>Real</title>'),{title:'Real',thumbnail:''});
 }
 assert.deepEqual(await page('<!--'+fake+'--><meta property="og:title" content="Real og"><meta property="og:image" content="/real.png">'),{title:'Real og',thumbnail:'https://example.com/real.png'});
});

test('unclosed comments, scripts and styles hide their fake tags and bad input stays bounded',async()=>{
 const page=html=>linkMetadata('https://example.com/a',async()=>({bytes:Buffer.from(html),url:'https://example.com/a',type:'text/html'}));
 const fake='<meta property="og:title" content="Fake"><meta property="og:image" content="https://example.com/fake.png">';
 for(const opener of ['<!--','<script>','<style>','<SCRIPT type="x">'])assert.deepEqual(await page('<title>Real</title>'+opener+fake),{title:'Real',thumbnail:''},opener);
 for(const html of ['','   \n ','<','<!--','<script','<style>','-->','</script>'])assert.deepEqual(await page(html),{title:'example.com',thumbnail:''},html);
 const started=Date.now();
 for(const html of ['<!--'.repeat(40000),'<script>'.repeat(20000),'<style '.repeat(20000),'<meta '.repeat(20000)])await page(html);
 assert.ok(Date.now()-started<5000);
});

test('a script or comment marker inside a meta attribute does not hide the real preview tags',async()=>{
 const page=html=>linkMetadata('https://example.com/a',async()=>({bytes:Buffer.from(html),url:'https://example.com/a',type:'text/html'}));
 const real='<meta property="og:title" content="Real"><meta property="og:image" content="/real.png">';
 for(const marker of ['<script>','<style>','<!--']){
  assert.deepEqual(await page('<meta name="keywords" content="a '+marker+' b">'+real+'<script>x</script>'),{title:'Real',thumbnail:'https://example.com/real.png'},marker);
 }
});
