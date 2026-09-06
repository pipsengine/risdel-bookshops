import { getRows, SHEETS } from "@/lib/sheets";

const bool=(v:any)=>v===true||String(v).toLowerCase()==="true"||String(v)==="1";
const sort=(rows:any[], key="Name")=>rows.sort((a,b)=>Number(a.SortOrder||0)-Number(b.SortOrder||0)||String(a[key]||"").localeCompare(String(b[key]||"")));
const active=(rows:any[])=>rows.filter(r=>bool(r.IsActive??true));

export async function academicStructure(){
  const [curricula,sessions,terms,classes,levels,categories,hierarchy]=await Promise.all([
    getRows(SHEETS.catalogueCurricula),getRows(SHEETS.catalogueAcademicSessions),getRows(SHEETS.catalogueTerms),getRows(SHEETS.catalogueClasses),getRows(SHEETS.catalogueAcademicLevels),getRows(SHEETS.catalogueCategories),getRows(SHEETS.catalogueCategoryHierarchy)
  ]);
  const levelMap=new Map(levels.map(x=>[x.Id,x]));
  const sessionMap=new Map(sessions.map(x=>[x.Id,x]));
  const categoryMap=new Map(categories.map(x=>[x.Id,x]));
  return {
    curricula:sort(curricula.map(x=>({...x,IsActive:bool(x.IsActive??true)}))),
    sessions:sort(sessions.map(x=>({...x,IsActive:bool(x.IsActive??true),IsCurrent:bool(x.IsCurrent)})),"StartDate").reverse(),
    terms:sort(terms.map(x=>({...x,IsActive:bool(x.IsActive??true),SessionName:sessionMap.get(x.SessionId)?.Name||"—"}))),
    classes:sort(classes.map(x=>({...x,IsActive:bool(x.IsActive??true),AcademicLevelName:levelMap.get(x.AcademicLevelId)?.Name||"—"}))),
    categories:sort(categories.map(x=>({...x,IsActive:bool(x.IsActive??true),ParentName:categoryMap.get(hierarchy.find(h=>h.ChildCategoryId===x.Id&&bool(h.IsActive??true))?.ParentCategoryId)?.Name||"Top level"}))),
    levels:sort(active(levels)),
    summary:{curricula:active(curricula).length,sessions:active(sessions).length,currentSessions:sessions.filter(x=>bool(x.IsCurrent)&&bool(x.IsActive??true)).length,terms:active(terms).length,classes:active(classes).length,hierarchies:active(hierarchy).length}
  };
}

export async function catalogueImportHistory(){
  const rows=await getRows(SHEETS.catalogueImportJobs);
  return rows.map(x=>({...x,IsActive:bool(x.IsActive??true),TotalRows:Number(x.TotalRows||0),SuccessRows:Number(x.SuccessRows||0),ErrorRows:Number(x.ErrorRows||0)})).sort((a,b)=>String(b.CreatedAt||"").localeCompare(String(a.CreatedAt||""))).slice(0,25);
}

export async function publisherImprints(){
 const [imprints,publishers]=await Promise.all([getRows(SHEETS.catalogueImprints),getRows(SHEETS.cataloguePublishers)]);const p=new Map(publishers.map(x=>[x.Id,x]));
 return imprints.map(x=>({...x,IsActive:bool(x.IsActive??true),PublisherName:p.get(x.PublisherId)?.Name||"—"})).sort((a,b)=>String(a.PublisherName).localeCompare(String(b.PublisherName))||String(a.Name).localeCompare(String(b.Name)));
}
