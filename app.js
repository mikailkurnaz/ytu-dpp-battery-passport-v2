(async function () {
  const elModes = document.getElementById("modes");
  const elTabs = document.getElementById("tabs");
  const elContent = document.getElementById("content");

  const MODES = [
    { id: "public", label: "Kamuya Açık" },
    { id: "professional", label: "Profesyonel" },
    { id: "controller", label: "Denetim Otoritesi" }
  ];

  const ALL_TABS = [
    { id: "overview", label: "Genel" },
    { id: "materials", label: "Malzeme" },
    { id: "carbon", label: "Karbon Ayak İzi" },
    { id: "performance", label: "Performans" },
    { id: "circularity", label: "Döngüsel Ekonomi" },
    { id: "legal", label: "Yasal & Atık" },
    { id: "dynamic", label: "Dinamik Veriler" },
    { id: "compliance", label: "Uyumluluk" }
  ];

  const state = {
    mode: "public",
    tab: "overview",
    data: null
  };

  function allowedTabs(mode) {
    if (mode === "public") return ["overview", "materials", "carbon", "performance", "circularity", "legal"];
    if (mode === "professional") return ["overview", "materials", "carbon", "performance", "circularity", "legal", "dynamic"];
    return ["overview", "materials", "carbon", "performance", "circularity", "legal", "dynamic", "compliance"];
  }

  function btn(className, text, onClick, active) {
    const b = document.createElement("button");
    b.className = className + (active ? " active" : "");
    b.textContent = text;
    b.onclick = onClick;
    return b;
  }

  function kv(key, value) {
    const v = (value === undefined || value === null || value === "") ? "Veri mevcut değil" : value;
    return `<div class="kv"><div class="k">${escapeHtml(key)}</div><div class="v">${escapeHtml(String(v))}</div></div>`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function badge(text, kind) {
    const cls = kind === "warn" ? "pill warn" : "pill";
    return `<span class="${cls}">${escapeHtml(text)}</span>`;
  }

  async function load() {
    try {
      const res = await fetch("./passport.json", { cache: "no-store" });
      state.data = await res.json();
    } catch (e) {
      state.data = null;
      elContent.innerHTML = `<div class="box">passport.json okunamadı. Dosya yolu doğru mu? (docs/passport.json)</div>`;
      return;
    }
    render();
  }

  function renderModes() {
    elModes.innerHTML = "";
    MODES.forEach(m => {
      elModes.appendChild(
        btn("btn", m.label, () => {
          state.mode = m.id;
          const okTabs = allowedTabs(state.mode);
          if (!okTabs.includes(state.tab)) state.tab = okTabs[0];
          render();
        }, state.mode === m.id)
      );
    });
  }

  function renderTabs() {
    elTabs.innerHTML = "";
    const ok = allowedTabs(state.mode);
    ALL_TABS.filter(t => ok.includes(t.id)).forEach(t => {
      elTabs.appendChild(
        btn("tab", t.label, () => { state.tab = t.id; render(); }, state.tab === t.id)
      );
    });
  }

  function render() {
    renderModes();
    renderTabs();
    elContent.innerHTML = renderTab();
  }

  function renderTab() {
    const d = state.data;
    if (!d) return `<div class="box">Veri yok</div>`;

    switch (state.tab) {
      case "overview": return renderOverview(d);
      case "materials": return renderMaterials(d);
      case "carbon": return renderCarbon(d);
      case "performance": return renderPerformance(d);
      case "circularity": return renderCircularity(d);
      case "legal": return renderLegal(d);
      case "dynamic": return renderDynamic(d);
      case "compliance": return renderCompliance(d);
      default: return `<div class="box">Sekme bulunamadı</div>`;
    }
  }

  function renderOverview(d) {
    const b = d.battery;
    return `
      <h2>Genel Kimlik</h2>
      <div class="grid2">
        <div class="box">
          ${kv("Pasaport ID", d.passport?.id)}
          ${kv("Üretici", b?.manufacturer)}
          ${kv("Pil Kategorisi", b?.category)}
          ${kv("Üretim Tarihi (ay/yıl)", `${b?.manufacturing?.month ?? "Veri mevcut değil"} / ${b?.manufacturing?.year ?? "Veri mevcut değil"}`)}
          ${kv("Üretim Ülkesi", b?.manufacturing?.country)}
          ${kv("Üretim Yeri Adresi", b?.manufacturing?.address)}
        </div>
        <div class="box">
          ${kv("Pil Kimyası", b?.chemistry?.label)}
          ${kv("Ağırlık", b?.weight)}
          ${kv("Nominal Kapasite", b?.capacity)}
        </div>
      </div>
    `;
  }

  function renderMaterials(d) {
    const m = d.materials;
    let html = `
      <h2>Malzeme İçeriği</h2>
      <div class="grid2">
        <div class="box">
          ${kv("Kritik Ham Maddeler", m?.criticalRawMaterials)}
          ${kv("Tehlikeli Maddeler (Hg/Cd/Pb hariç)", m?.hazardousSubstances)}
        </div>
        <div class="box">
          <div style="opacity:.85;margin-bottom:8px"><b>Not:</b> Kamuya açık görünümde detaylı bileşim/parça bilgileri gizlenir.</div>
          ${badge(state.mode === "public" ? "Kamuya Açık Görünüm" : "Detay Görünüm", state.mode === "public" ? "warn" : "ok")}
        </div>
      </div>
    `;

    if (state.mode !== "public") {
      html += `
        <div class="grid2" style="margin-top:14px">
          <div class="box">
            <h3>Detaylı Bileşim</h3>
            ${kv("Katot", m?.detailedComposition?.cathode)}
            ${kv("Anot", m?.detailedComposition?.anode)}
            ${kv("Elektrolit", m?.detailedComposition?.electrolyte)}
          </div>
          <div class="box">
            <h3>Parça Bilgileri</h3>
            ${kv("Parça Numaraları", m?.parts?.partNumbers)}
            ${kv("Yedek Parça İletişim", m?.parts?.sparePartContacts)}
          </div>
        </div>
      `;
    }
    return html;
  }

  function renderCarbon(d) {
    const c = d.carbonFootprint;
    return `
      <h2>Sürdürülebilirlik (Karbon Ayak İzi)</h2>
      <div class="grid2">
        <div class="box">
          ${kv("Toplam", `${c?.total ?? "Veri mevcut değil"} ${c?.unit ?? ""}`)}
          ${kv("Kaynak", c?.reference)}
          ${kv("Not", c?.note)}
        </div>
        <div class="box">
          ${kv("Hammadde", c?.stages?.rawMaterial)}
          ${kv("Üretim", c?.stages?.manufacturing)}
          ${kv("Taşıma", c?.stages?.transport)}
          ${kv("Ömür Sonu", c?.stages?.endOfLife)}
        </div>
      </div>
    `;
  }

  function renderPerformance(d) {
    const p = d.performance;
    const b = d.battery;
    return `
      <h2>Performans</h2>
      <div class="grid2">
        <div class="box">
          ${kv("Nominal Kapasite", b?.capacity)}
          ${kv("Voltaj (min)", p?.voltageMin)}
          ${kv("Voltaj (nom)", p?.voltageNom)}
          ${kv("Voltaj (max)", p?.voltageMax)}
        </div>
        <div class="box">
          ${kv("Güç Kapasitesi", p?.powerCapacity)}
          ${kv("Sıcaklık (min)", p?.temperatureMin)}
          ${kv("Sıcaklık (max)", p?.temperatureMax)}
          ${kv("Döngü Ömrü", p?.cycleLife)}
          ${kv("Enerji Verimliliği", p?.energyEfficiency)}
        </div>
      </div>
    `;
  }

  function renderCircularity(d) {
    const c = d.circularity;
    return `
      <h2>Döngüsel Ekonomi</h2>
      <div class="grid2">
        <div class="box">
          ${kv("Onarılabilirlik Skoru", c?.repairability)}
          ${kv("Geri Dönüşüm Bilgisi", c?.recyclability)}
          ${kv("Geri Dönüştürülmüş İçerik", c?.recycledContent)}
          ${kv("İkinci Ömür Uygunluğu", c?.secondLife)}
        </div>
        <div class="box">
          <h3>Mevcut Dökümanlar</h3>
          ${kv("Söküm Talimatları", c?.documents?.dismantlingInstructions)}
          ${kv("Güvenlik Veri Sayfası (SDS)", c?.documents?.sds)}
        </div>
      </div>
    `;
  }

  function renderLegal(d) {
    const l = d.legalAndWaste;
    return `
      <h2>Yasal & Atık</h2>
      <div class="box">
        ${kv("AB Uygunluk Beyanı (EU DoC)", l?.euDeclarationOfConformity)}
        ${kv("Atık Önleme ve Yönetimi", l?.wastePreventionAndManagement)}
      </div>
    `;
  }

  function renderDynamic(d) {
    const dy = d.dynamic;
    return `
      <h2>Dinamik Veriler</h2>
      <div class="box">
        ${kv("Performans/Dayanıklılık Kayıtları", dy?.performanceRecords)}
        ${kv("Sağlık Durumu (SoH)", dy?.soh)}
        ${kv("Pil Statüsü", dy?.batteryStatus)}
        ${kv("Kullanım Verileri (SoC, döngü, olaylar)", dy?.usageData)}
      </div>
    `;
  }

  function renderCompliance(d) {
    const c = d.compliance || {};
    return `
      <h2>Uyumluluk</h2>
      <div class="grid2">
        <div class="box">
          ${kv("RoHS", c.rohs)}
          ${kv("REACH", c.reach)}
          ${kv("CE", c.ce)}
        </div>
        <div class="box">
          ${kv("Test Raporu", c.testReport)}
          ${kv("Ürün Sertifikaları", c.productCertificates)}
        </div>
      </div>
    `;
  }

  renderModes();
  await load();
})();
