import type { CanvasNote } from './model'

export const NOTE_WIDTH = 218
export const NOTE_MAX_LINES = 4
const bound = (n:number) => Math.min(10000, Math.max(-10000, n))
export function canvasNoteAt(id:string, text:string, target:{x:number;y:number}): CanvasNote {
  return {
    id, text: text.trim(),
    x: bound(target.x + 72), y: bound(target.y - 96),
    targetX: bound(target.x), targetY: bound(target.y),
  }
}
export function movedCanvasNote(note:CanvasNote, x:number, y:number): CanvasNote {
  return {...note, x:bound(x), y:bound(y)}
}
export function canvasNoteLines(value:string):string[] {
  const raw = value.replace(/\r/g,'').split('\n').flatMap(line=>{
    // A CJK glyph occupies about twice the width of most Latin characters in SVG.
    // Keep the card readable in both languages, including when a long word has no spaces.
    const chunks:string[]=[]
    let current='',units=0
    const glyphWidth=(character:string)=>/[^\u0000-\u00ff]/u.test(character)?1:0.54
    for(const character of Array.from(line)){
      const weight=glyphWidth(character)
      if(character===' '&&!current)continue
      if(current&&units+weight>12.4){
        const breakAt=current.lastIndexOf(' ')
        if(breakAt>0){
          chunks.push(current.slice(0,breakAt).trimEnd())
          current=current.slice(breakAt+1)
          units=Array.from(current).reduce((n,c)=>n+glyphWidth(c),0)
        }else{
          chunks.push(current.trimEnd());current='';units=0
        }
      }
      if(character===' '&&!current)continue
      current+=character;units+=weight
    }
    if(current)chunks.push(current)
    return chunks.length?chunks:['']
  })
  if(raw.length>NOTE_MAX_LINES){
    const last=Array.from(raw[NOTE_MAX_LINES-1]);last.pop()
    return [...raw.slice(0,NOTE_MAX_LINES-1),last.join('')+'…']
  }
  return raw
}
export function noteCardHeight(text:string):number {
  return Math.max(58, 26+canvasNoteLines(text).length*19)
}
