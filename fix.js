const fs = require('fs');
const path = require('path');

const filePath = path.join('..', 'barakat', 'src', 'content', 'aura-pages.ts');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = "<!-- SEARCH -->\\n  <section class=\\\"search-section\\\">";
const endMarker = "<!-- FEATURED LISTINGS -->";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const brokenPart = content.substring(startIndex, endIndex);
  
  const properHTML = `<!-- SEARCH -->
  <section class="search-section">
    <div class="search-wrap">
      <div class="search-tabs" style="gap: 8px; margin-bottom: 24px;">
        <button class="s-tab active" onclick="setSearchTab(this,'buy')" style="background: var(--gold); color: var(--ink);">Купить</button>
        <button class="s-tab" onclick="setSearchTab(this,'sell')">Продать</button>
        <button class="s-tab" onclick="setSearchTab(this,'rent')">Снять</button>
        <button class="s-tab" onclick="setSearchTab(this,'lease')">Сдать</button>
        <button class="s-tab" onclick="navigate('map')">На карте</button>
        <button class="s-tab" onclick="navigate('services')">Оценить</button>
        <button class="s-tab" onclick="navigate('services')">Сроч. выкуп</button>
      </div>
      <div class="search-row" style="align-items: flex-start; gap: 12px;">
        <div style="flex: 1.2;">
          <select class="s-select" style="width: 100%; height: 100%; min-height: 48px; padding-left: 16px;">
            <option>Тип недвижимости</option>
            <option>Вторичка</option>
            <option>Новостройки</option>
            <option>Дома</option>
            <option>Земельные участки</option>
            <option>Коммерческая</option>
            <option>Квартира</option>
          </select>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <select class="s-select" style="width: 100%; padding-left: 16px;">
            <option>Комнат</option>
            <option>1 комната</option>
            <option>2 комнаты</option>
            <option>3 комнаты</option>
            <option>4+ комнат</option>
          </select>
          <div style="display: flex; gap: 8px;">
            <input class="s-input" placeholder="От" style="width: 50%; padding-left: 16px; padding-right: 12px;"/>
            <input class="s-input" placeholder="До" style="width: 50%; padding-left: 16px; padding-right: 12px;"/>
          </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
          <select class="s-select" style="width: 100%; padding-left: 16px;">
            <option>Цена</option>
          </select>
          <div style="display: flex; gap: 8px;">
            <input class="s-input" placeholder="От" style="width: 50%; padding-left: 16px; padding-right: 12px;"/>
            <input class="s-input" placeholder="До" style="width: 50%; padding-left: 16px; padding-right: 12px;"/>
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex: 1.1; align-items: flex-start;">
          <button class="s-btn" style="flex: 1; background: var(--cream); color: var(--ink); border: 1.5px solid var(--border); box-shadow: none; justify-content: center;">Все фильтры</button>
          <button class="s-btn" onclick="navigate('listings')" style="flex: 1; justify-content: center;">Найти</button>
        </div>
      </div>
    </div>
  </section>

  `;
  
  content = content.replace(brokenPart, properHTML);
  fs.writeFileSync(filePath, content);
  console.log("Fixed successfully!");
} else {
  console.log("Could not find start/end markers.");
  console.log("Start found:", startIndex);
  console.log("End found:", endIndex);
}
