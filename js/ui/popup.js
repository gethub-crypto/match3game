function showPopup(text) { const popup = document.getElementById('popup'); 
                          const content = document.getElementById('popupContent');
                          content.innerHTML = text; popup.classList.remove('hidden'); }

function hidePopup() { document.getElementById('popup').classList.add('hidden'); }
