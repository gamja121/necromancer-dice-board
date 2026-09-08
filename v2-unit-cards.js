(function(root) {
  const ART = ['minotaur','ice-lord','plague-frog','orc-warrior','plague-doctor','ghoul','goblin-chief','goblin-soldier','sea-wolf','grave-priest','abyss-eye','doom-executor','death-knight','hell-mantis','scorpion-knight','ancient-treant','stone-golem','kraken','crystal-devourer','skeleton-spear','skeleton-archer','skeleton-cavalry','spider-knight','raging-treant','cerberus','mushroom-soldier','goblin-rider','abyss-harpy','boulder-ogre','bone-golem','forest-fairy','flesh-golem','hydra','ice-princess'];
  let selected;
  function clearSelection() {
    if (selected) selected.classList.toggle('is-selected', false);
    selected = null;
  }
  function sync(field, units, openInfo) {
    let dock = field.querySelector('.unit-card-dock');
    if (!dock) {
      dock = document.createElement('nav'); dock.className = 'unit-card-dock';
      dock.setAttribute('aria-label','전장 유닛 정보 카드'); field.append(dock);
    }
    dock.replaceChildren();
    clearSelection();
    for (const team of ['ally','enemy']) {
      const group = document.createElement('div'); group.className = 'unit-card-team';
      group.setAttribute('aria-label',team === 'ally' ? '아군' : '적군');
      const entries = units.filter(u => u.team === team).sort((a,b) => team === 'ally' ? a.slot-b.slot : b.slot-a.slot);
      for (const unit of entries) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'unit-info-card'; button.dataset.unit = unit.slug;
        // Stable irregular placement: state updates never shuffle touch targets.
        const index = entries.indexOf(unit);
        button.style.transform = 'rotate(' + [-3,2,-1,3,-2][(index + (team === 'enemy' ? 2 : 0)) % 5] + 'deg)';
        button.setAttribute('aria-label', (team === 'ally' ? '아군 ' : '적군 ') + unit.name + ' 정보 보기');
        button.title = unit.name;
        const art = document.createElement('span'); art.className = 'unit-card-art';
        if (ART.includes(unit.slug)) {
          // Crop the supplied 1280x575 photo to the card only, without changing the original.
          art.classList.add('has-card-art');
          art.style.backgroundImage = 'url("art/v2-style/ui/unit-card-' + unit.slug + '.jpg?v=8")';
        } else {
          const image = document.createElement('img'); image.src = unit.portrait; image.alt = '';
          art.append(image);
        }
        button.append(art);
        button.addEventListener('click',() => {
          clearSelection(); selected = button;
          button.classList.toggle('is-selected', true);
          openInfo(unit);
        });
        unit.infoCard = button; update(unit); group.append(button);
      }
      dock.append(group);
    }
  }
  function update(unit) {
    if (!unit.infoCard) return;
    unit.infoCard.classList.toggle('is-dead', !unit.alive);
    unit.infoCard.title = unit.name + ' · ' + Math.max(0,unit.hp) + '/' + unit.maxHp;
  }
  const api = { ART,sync,update,clearSelection };
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.V2UnitCards=api;
})(globalThis);
