import json, re, sqlite3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
db=sqlite3.connect(ROOT/'data/tibiawiki.db'); db.row_factory=sqlite3.Row
slug=lambda s: re.sub(r'(^-|-$)','',re.sub(r'[^a-z0-9]+','-',s.lower()))
local={p.stem for p in (ROOT/'assets/items').glob('*.webp')}; items={}
for row in db.execute('select article_id,title,item_class,item_type,type_secondary from item'):
    if slug(row['title']) not in local: continue
    attrs={a['name']:a['value'] for a in db.execute('select name,value from item_attribute where item_id=?',(row['article_id'],))}; levels={}
    for p in db.execute('select proficiency_level,skill_image,icon,effect from item_proficiency_perk where item_id=? order by proficiency_level',(row['article_id'],)):
        levels.setdefault(str(p['proficiency_level']),[]).append({'effect':p['effect'],'icon':p['icon'],'skillImage':p['skill_image']})
    items[row['title']]={'class':row['item_class'],'type':row['item_type'],'secondaryType':row['type_secondary'],'attributes':attrs,'proficiency':levels}
imbuements=[dict(x) for x in db.execute("select title,name,tier,type,category,effect,slots from imbuement where status='active' order by category,tier")]
(ROOT/'data/game-data.json').write_text(json.dumps({'source':'TibiaWikiSQL 8.0.1','items':items,'imbuements':imbuements},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'Exported {len(items)} items, {sum(len(v["proficiency"]) for v in items.values())} levels, {len(imbuements)} imbuements')
