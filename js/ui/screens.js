function updateScreens() { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

if (currentScreen === 'menu') document.getElementById('menuScreen').classList.add('active'); 
                          if (currentScreen === 'map') document.getElementById('mapScreen').classList.add('active'); 
                          if (currentScreen === 'game') document.getElementById('gameScreen').classList.add('active'); }
