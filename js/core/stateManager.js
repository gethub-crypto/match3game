let currentScreen = 'menu';

function goTo(screen) {
  currentScreen = screen;
  updateScreens();
  
  // При переходе на карту уровней — рендерим сетку
  if (screen === 'map') {
    renderLevelMap();
  }
}
