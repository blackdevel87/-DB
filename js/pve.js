import {
    db,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "./firebase-config.js";

import { state } from "./state.js";

// ============================================
// 상태
// ============================================
let pveData = {};         // { stageId: { name, category, builds: {...} } }
let currentStageId = null;
let currentBuildKey = "build1";
let currentCategory = "siege";

const CATEGORY_LABELS = { siege: "공성전", advent: "강림원정대", raid: "레이드" };

// ============================================
// 1. 메인 페이지
// ============================================
window.showPvePage = async function () {
    const main = document.querySelector(".main");
    if (!main) return;

    const isAdmin = state.currentRole === "admin";

    main.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <div>
                    <h2 style="margin:0;">🧩 PVE 공략</h2>
                    <p style="color:#9ca3af; margin-top:4px;">스테이지를 선택하여 공략을 확인하세요</p>
                </div>
                ${isAdmin ? `
                <button onclick="showAddStagePage()"
                    style="background:#2563eb; color:white; border:none; border-radius:10px; padding:10px 16px; font-size:14px; font-weight:700; cursor:pointer;">
                    + 스테이지 추가
                </button>` : ""}
            </div>

            <!-- 검색 -->
            <input type="text" id="pveSearch" placeholder="스테이지 이름 검색..."
                style="width:100%; padding:14px; background:#374151; border:1px solid #4b5563; border-radius:12px; color:white; font-size:14px; margin-bottom:16px;"
                oninput="filterPveList()" />

            <!-- 카테고리 탭 -->
            <div style="display:flex; gap:8px; margin-bottom:16px; flex-wrap:wrap;">
                <button id="pveTab_siege"  onclick="switchPveCategory('siege')"  class="pve-tab-btn active-pve">🏯 공성전</button>
                <button id="pveTab_advent" onclick="switchPveCategory('advent')" class="pve-tab-btn">⚔️ 강림원정대</button>
                <button id="pveTab_raid"   onclick="switchPveCategory('raid')"   class="pve-tab-btn">🐉 레이드</button>
            </div>

            <!-- 스테이지 목록 -->
            <div id="pveStageList" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:8px; margin-bottom:20px;">
                <div style="color:#9ca3af; text-align:center; padding:20px; grid-column:1/-1;">불러오는 중...</div>
            </div>

            <!-- 상세 카드 -->
            <div id="pveDetailCard" style="display:none; background:#1f2937; border:1px solid #374151; border-radius:14px; padding:20px;">

                <!-- 헤더 -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
                    <div>
                        <div id="pveCardTitle" style="font-size:18px; font-weight:900;"></div>
                        <div id="pveCardCategory" style="font-size:12px; color:#9ca3af; margin-top:3px;"></div>
                    </div>
                    ${isAdmin ? `
                    <button onclick="deleteCurrentStage()"
                        style="background:#dc2626; color:white; border:none; border-radius:8px; padding:6px 12px; font-size:12px; cursor:pointer; font-weight:700;">
                        🗑️ 삭제
                    </button>` : ""}
                </div>

                <!-- 빌드 탭 -->
                <div style="margin-bottom:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="font-size:11px; color:#9ca3af; font-weight:700;">🛠️ 빌드</div>
                        ${isAdmin ? `
                        <div style="display:flex; gap:6px;">
                            <button onclick="addPveBuild()"
                                style="padding:5px 10px; border-radius:7px; border:1px dashed #3b82f6; background:rgba(59,130,246,0.1); color:#60a5fa; font-size:11px; font-weight:700; cursor:pointer;">
                                + 추가
                            </button>
                            <button onclick="deleteCurrentBuild()"
                                style="padding:5px 10px; border-radius:7px; border:1px solid rgba(220,38,38,0.4); background:rgba(220,38,38,0.1); color:#f87171; font-size:11px; font-weight:700; cursor:pointer;">
                                🗑️ 삭제
                            </button>
                        </div>` : ""}
                    </div>
                    <div id="pveBuildTabs" style="display:flex; gap:6px; flex-wrap:wrap;"></div>
                </div>

                <!-- 보기 모드 -->
                <div id="pveViewMode">
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="background:#374151; border-radius:10px; padding:14px;">
                            <div style="font-size:11px; color:#9ca3af; font-weight:700; margin-bottom:6px;">⚔️ 덱 조합</div>
                            <div id="viewPveDeck" style="font-size:14px; white-space:pre-wrap; line-height:1.6;">-</div>
                        </div>
                        <div style="background:#374151; border-radius:10px; padding:14px;">
                            <div style="font-size:11px; color:#9ca3af; font-weight:700; margin-bottom:6px;">📜 스킬 순서</div>
                            <div id="viewPveSkill" style="font-size:14px; white-space:pre-wrap; line-height:1.6;">-</div>
                        </div>
                        <div style="background:#374151; border-radius:10px; padding:14px;">
                            <div style="font-size:11px; color:#9ca3af; font-weight:700; margin-bottom:6px;">🛡️ 장비 세팅</div>
                            <div id="viewPveEquip" style="font-size:14px; white-space:pre-wrap; line-height:1.6;">-</div>
                        </div>
                        <div style="background:#374151; border-radius:10px; padding:14px;">
                            <div style="font-size:11px; color:#9ca3af; font-weight:700; margin-bottom:6px;">📝 메모</div>
                            <div id="viewPveNote" style="font-size:14px; white-space:pre-wrap; line-height:1.6;">-</div>
                        </div>
                    </div>
                    ${isAdmin ? `
                    <button onclick="enablePveEdit()"
                        style="width:100%; margin-top:14px; padding:12px; background:#2563eb; color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer;">
                        ✏️ 수정하기
                    </button>` : ""}
                </div>

                <!-- 수정 모드 (관리자) -->
                <div id="pveEditMode" style="display:none;">
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div>
                            <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">빌드 이름</div>
                            <input id="editBuildName" type="text" placeholder="예: 딜링 빌드, 안정 빌드"
                                style="width:100%; padding:10px; background:#374151; border:1px solid #4b5563; border-radius:8px; color:white; font-size:14px;" />
                        </div>
                        <div>
                            <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">⚔️ 덱 조합</div>
                            <textarea id="editPveDeck" rows="3" placeholder="예: 라드그리드 트루드 엘리시아 ..."
                                style="width:100%; padding:10px; background:#374151; border:1px solid #4b5563; border-radius:8px; color:white; font-size:14px; resize:vertical;"></textarea>
                        </div>
                        <div>
                            <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">📜 스킬 순서</div>
                            <textarea id="editPveSkill" rows="4" placeholder="스킬 순서를 입력하세요"
                                style="width:100%; padding:10px; background:#374151; border:1px solid #4b5563; border-radius:8px; color:white; font-size:14px; resize:vertical;"></textarea>
                        </div>
                        <div>
                            <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">🛡️ 장비 세팅</div>
                            <textarea id="editPveEquip" rows="4" placeholder="장비 세팅을 입력하세요"
                                style="width:100%; padding:10px; background:#374151; border:1px solid #4b5563; border-radius:8px; color:white; font-size:14px; resize:vertical;"></textarea>
                        </div>
                        <div>
                            <div style="font-size:11px; color:#60a5fa; font-weight:700; margin-bottom:4px;">📝 메모</div>
                            <textarea id="editPveNote" rows="3" placeholder="기타 메모나 주의사항"
                                style="width:100%; padding:10px; background:#374151; border:1px solid #4b5563; border-radius:8px; color:white; font-size:14px; resize:vertical;"></textarea>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px;">
                        <button onclick="savePveData()"
                            style="padding:12px; background:#2563eb; color:white; border:none; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer;">
                            💾 저장
                        </button>
                        <button onclick="cancelPveEdit()"
                            style="padding:12px; background:#374151; color:#9ca3af; border:1px solid #4b5563; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer;">
                            취소
                        </button>
                    </div>
                </div>

            </div>
        </div>
    `;

    await loadPveData();
    renderPveStageList();
};

// ============================================
// 2. 데이터 로드
// ============================================
async function loadPveData() {
    try {
        const snap = await getDocs(collection(db, "pveStages"));
        pveData = {};
        snap.forEach(d => { pveData[d.id] = { ...d.data(), id: d.id }; });
    } catch (e) {
        console.error("PVE 데이터 로드 실패:", e);
    }
}

// ============================================
// 3. 카테고리 전환
// ============================================
window.switchPveCategory = function (cat) {
    currentCategory = cat;
    currentStageId = null;

    ["siege", "advent", "raid"].forEach(c => {
        const btn = document.getElementById(`pveTab_${c}`);
        if (btn) btn.className = c === cat ? "pve-tab-btn active-pve" : "pve-tab-btn";
    });

    const card = document.getElementById("pveDetailCard");
    if (card) card.style.display = "none";

    renderPveStageList();
};

// ============================================
// 4. 스테이지 목록 렌더링
// ============================================
function renderPveStageList(searchQuery = "") {
    const list = document.getElementById("pveStageList");
    if (!list) return;

    const filtered = Object.entries(pveData).filter(([, s]) =>
        s.category === currentCategory &&
        (!searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (filtered.length === 0) {
        list.innerHTML = `<div style="color:#9ca3af; text-align:center; padding:20px; grid-column:1/-1;">${searchQuery ? "검색 결과 없음" : "등록된 스테이지가 없습니다"}</div>`;
        return;
    }

    list.innerHTML = filtered.map(([id, s]) => `
        <button onclick="selectPveStage('${id}')"
            style="padding:14px 8px; background:${currentStageId === id ? "rgba(37,99,235,0.2)" : "#374151"};
                   border:${currentStageId === id ? "1.5px solid #3b82f6" : "1px solid #4b5563"};
                   border-radius:10px; color:white; font-size:13px; font-weight:700; cursor:pointer;
                   text-align:center; line-height:1.4; transition:all 0.15s;">
            ${s.name || "이름 없음"}
        </button>
    `).join("");
}

// ============================================
// 5. 검색 필터
// ============================================
window.filterPveList = function () {
    const q = document.getElementById("pveSearch")?.value || "";
    renderPveStageList(q);
};

// ============================================
// 6. 스테이지 선택
// ============================================
window.selectPveStage = async function (id) {
    currentStageId = id;
    currentBuildKey = "build1";
    renderPveStageList(document.getElementById("pveSearch")?.value || "");

    const stage = pveData[id];
    if (!stage) return;

    document.getElementById("pveCardTitle").textContent = stage.name || "이름 없음";
    document.getElementById("pveCardCategory").textContent = CATEGORY_LABELS[stage.category] || "";
    document.getElementById("pveDetailCard").style.display = "block";
    document.getElementById("pveDetailCard").scrollIntoView({ behavior: "smooth", block: "nearest" });

    renderBuildTabs(stage.builds || {});
    renderBuildContent(stage.builds || {}, currentBuildKey);
    cancelPveEdit();
};

// ============================================
// 7. 빌드 탭 렌더링
// ============================================
function renderBuildTabs(builds) {
    const wrap = document.getElementById("pveBuildTabs");
    if (!wrap) return;

    const keys = Object.keys(builds).filter(k => k.startsWith("build")).sort();
    if (keys.length === 0) {
        wrap.innerHTML = `<span style="font-size:12px; color:#9ca3af;">빌드가 없습니다</span>`;
        return;
    }

    wrap.innerHTML = keys.map(k => `
        <button onclick="switchPveBuild('${k}')" id="pveBuildTab_${k}"
            style="padding:8px 16px; border-radius:8px; border:1.5px solid ${k === currentBuildKey ? "#3b82f6" : "#4b5563"};
                   background:${k === currentBuildKey ? "rgba(59,130,246,0.15)" : "#374151"};
                   color:${k === currentBuildKey ? "#60a5fa" : "#9ca3af"};
                   font-size:13px; font-weight:700; cursor:pointer;">
            ${builds[k].buildName || k}
        </button>
    `).join("");
}

// ============================================
// 8. 빌드 전환
// ============================================
window.switchPveBuild = function (key) {
    currentBuildKey = key;
    const stage = pveData[currentStageId];
    if (!stage) return;
    renderBuildTabs(stage.builds || {});
    renderBuildContent(stage.builds || {}, key);
    cancelPveEdit();
};

// ============================================
// 9. 빌드 내용 렌더링
// ============================================
function renderBuildContent(builds, key) {
    const b = builds[key] || {};
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || "-";
    };
    set("viewPveDeck", b.deck);
    set("viewPveSkill", b.skill);
    set("viewPveEquip", b.equip);
    set("viewPveNote", b.note);
}

// ============================================
// 10. 수정 모드 열기/닫기
// ============================================
window.enablePveEdit = function () {
    const stage = pveData[currentStageId];
    const b = stage?.builds?.[currentBuildKey] || {};

    document.getElementById("editBuildName").value = b.buildName || "";
    document.getElementById("editPveDeck").value = b.deck || "";
    document.getElementById("editPveSkill").value = b.skill || "";
    document.getElementById("editPveEquip").value = b.equip || "";
    document.getElementById("editPveNote").value = b.note || "";

    document.getElementById("pveViewMode").style.display = "none";
    document.getElementById("pveEditMode").style.display = "block";
};

window.cancelPveEdit = function () {
    document.getElementById("pveViewMode").style.display = "block";
    document.getElementById("pveEditMode").style.display = "none";
};

// ============================================
// 11. 빌드 데이터 저장
// ============================================
window.savePveData = async function () {
    if (!currentStageId) return;

    const buildName = document.getElementById("editBuildName").value.trim();
    const deck  = document.getElementById("editPveDeck").value.trim();
    const skill = document.getElementById("editPveSkill").value.trim();
    const equip = document.getElementById("editPveEquip").value.trim();
    const note  = document.getElementById("editPveNote").value.trim();

    try {
        const stageRef = doc(db, "pveStages", currentStageId);
        const snap = await getDoc(stageRef);
        if (!snap.exists()) return alert("스테이지를 찾을 수 없습니다.");

        const data = snap.data();
        const builds = data.builds || {};
        builds[currentBuildKey] = {
            buildName: buildName || builds[currentBuildKey]?.buildName || currentBuildKey,
            deck, skill, equip, note
        };

        await updateDoc(stageRef, { builds });

        pveData[currentStageId].builds = builds;
        renderBuildTabs(builds);
        renderBuildContent(builds, currentBuildKey);
        cancelPveEdit();
        alert("✅ 저장되었습니다!");
    } catch (e) {
        console.error(e);
        alert("저장 실패: " + e.message);
    }
};

// ============================================
// 12. 빌드 추가
// ============================================
window.addPveBuild = async function () {
    if (!currentStageId) return;

    try {
        const stageRef = doc(db, "pveStages", currentStageId);
        const snap = await getDoc(stageRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const builds = data.builds || {};

        let n = 1;
        while (builds[`build${n}`]) n++;
        const newKey = `build${n}`;
        const newName = `빌드 ${n}`;

        builds[newKey] = { buildName: newName, deck: "", skill: "", equip: "", note: "" };
        await updateDoc(stageRef, { builds });

        pveData[currentStageId].builds = builds;
        currentBuildKey = newKey;
        renderBuildTabs(builds);
        renderBuildContent(builds, newKey);
        enablePveEdit();
    } catch (e) {
        console.error(e);
        alert("빌드 추가 실패: " + e.message);
    }
};

// ============================================
// 13. 빌드 삭제
// ============================================
window.deleteCurrentBuild = async function () {
    if (!currentStageId) return;
    if (currentBuildKey === "build1") return alert("빌드 1은 삭제할 수 없습니다.");
    if (!confirm(`현재 빌드를 삭제할까요?`)) return;

    try {
        const stageRef = doc(db, "pveStages", currentStageId);
        const snap = await getDoc(stageRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const builds = data.builds || {};
        delete builds[currentBuildKey];

        await updateDoc(stageRef, { builds });

        pveData[currentStageId].builds = builds;
        currentBuildKey = "build1";
        cancelPveEdit();
        renderBuildTabs(builds);
        renderBuildContent(builds, currentBuildKey);
    } catch (e) {
        console.error(e);
        alert("삭제 실패: " + e.message);
    }
};

// ============================================
// 14. 스테이지 삭제
// ============================================
window.deleteCurrentStage = async function () {
    if (!currentStageId) return;
    const stage = pveData[currentStageId];
    if (!confirm(`"${stage?.name}" 스테이지를 삭제하시겠습니까?`)) return;

    try {
        await deleteDoc(doc(db, "pveStages", currentStageId));
        delete pveData[currentStageId];
        currentStageId = null;
        document.getElementById("pveDetailCard").style.display = "none";
        renderPveStageList(document.getElementById("pveSearch")?.value || "");
        alert("삭제되었습니다.");
    } catch (e) {
        console.error(e);
        alert("삭제 실패: " + e.message);
    }
};

// ============================================
// 15. 스테이지 추가 페이지 (관리자)
// ============================================
window.showAddStagePage = function () {
    if (state.currentRole !== "admin") return alert("관리자만 추가할 수 있습니다.");

    const main = document.querySelector(".main");
    if (!main) return;

    main.innerHTML = `
        <div class="card">
            <button onclick="showPvePage()" class="save-btn" style="background:#6b7280;">← 목록으로</button>
            <h2 style="margin-top:15px;">🧩 스테이지 추가</h2>
            <hr style="margin:20px 0; border-color:#374151;">

            <label style="color:#9ca3af; font-size:14px;">카테고리</label>
            <select id="newStageCategory"
                style="width:100%; padding:12px; background:#374151; border:1px solid #4b5563; border-radius:10px; color:white; font-size:14px; margin-bottom:16px;">
                <option value="siege">🏯 공성전</option>
                <option value="advent">⚔️ 강림원정대</option>
                <option value="raid">🐉 레이드</option>
            </select>

            <label style="color:#9ca3af; font-size:14px;">스테이지 이름</label>
            <input type="text" id="newStageName" placeholder="예: 드래곤 1관문"
                style="background:#374151; color:white; border:1px solid #4b5563;" />

            <button onclick="saveNewStage()" class="save-btn"
                style="width:100%; margin-top:20px; background:#2563eb; font-size:16px; padding:14px;">
                💾 등록하기
            </button>
        </div>
    `;
};

window.saveNewStage = async function () {
    const name = document.getElementById("newStageName")?.value.trim();
    const category = document.getElementById("newStageCategory")?.value;
    if (!name) return alert("스테이지 이름을 입력하세요.");

    try {
        await addDoc(collection(db, "pveStages"), {
            name,
            category,
            builds: {
                build1: { buildName: "빌드 1", deck: "", skill: "", equip: "", note: "" }
            },
            createdAt: serverTimestamp()
        });
        alert("스테이지가 등록되었습니다! ✅");
        currentCategory = category;
        showPvePage();
    } catch (e) {
        console.error(e);
        alert("등록 실패: " + e.message);
    }
};
