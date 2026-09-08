(function(root) {
  const ART = ['minotaur','ice-lord','plague-frog','orc-warrior','plague-doctor'];
  function sync(field, units, openInfo) {
    let dock = field.querySelector('.unit-card-dock');
    if (!dock) {
      dock = document.createElement('nav'); dock.className = 'unit-card-dock';
      dock.setAttribute('aria-label','전장 유닛 정보 카드'); field.append(dock);
    }
    dock.replaceChildren();
    for (const team of ['ally','enemy']) {
      const group = document.createElement('div'); group.className = 'unit-card-team';
      group.setAttribute('aria-label',team === 'ally' ? '아군' : '적군');
      const entries = units.filter(u => u.team === team).sort((a,b) => team === 'ally' ? a.slot-b.slot : b.slot-a.slot);
      for (const unit of entries) {
        const button = document.createElement('button'); button.type = 'button';
        button.className = 'unit-info-card'; button.dataset.unit = unit.slug;
        button.setAttribute('aria-label', (team === 'ally' ? '아군 ' : '적군 ') + unit.name + ' 정보 보기');
        button.title = unit.name;
        const art = document.createElement('span'); art.className = 'unit-card-art';
        if (ART.includes(unit.slug)) {
          // Crop the supplied 1280x575 photo to the card only, without changing the original.
          art.classList.add('has-card-art');
          art.style.backgroundImage = 'url("art/v2-style/ui/unit-card-' + unit.slug + '.jpg")';
        } else {
          const image = document.createElement('img'); image.src = unit.portrait; image.alt = '';
          art.append(image);
        }
        const label = document.createElement('span'); label.className = 'unit-card-name'; label.textContent = unit.name;
        button.append(art,label);
        button.addEventListener('click',() => openInfo(unit));
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
  const api = { ART,sync,update };
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
  else root.V2UnitCards=api;
})(globalThis);
