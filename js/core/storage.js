const Storage = { get(key, def)
{ return JSON.parse(localStorage.getItem(key)) ?? def; }, 
set(key, value) { localStorage.setItem(key, JSON.stringify(value)); } };
