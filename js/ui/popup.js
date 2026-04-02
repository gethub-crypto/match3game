// ===== POPUP SYSTEM =====

function showPopup(html){

const popup = document.getElementById("popup")
const content = document.getElementById("popupContent")

// вставляем содержимое
content.innerHTML = html

// показываем popup
popup.classList.remove("hidden")

}

// ===== HIDE POPUP =====

function hidePopup(){

const popup = document.getElementById("popup")

popup.classList.add("hidden")

}

// ===== OPTIONAL: закрытие по клику на затемнение =====

document.addEventListener("DOMContentLoaded",()=>{

const popup = document.getElementById("popup")

popup.addEventListener("click",(e)=>{

// если кликнули по фону
if(e.target.id==="popup"){
hidePopup()
}

})

})
