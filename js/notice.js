import {
    db,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    updateDoc,
    deleteDoc
} from "./firebase-config.js";

import { state } from "./state.js";


window.saveNotice = async function(){

    if(state.currentRole !== "admin"){
        alert("관리자만 공지 등록이 가능합니다.");
        return;
    }

    const title = document.getElementById("noticeTitle").value.trim();
    const content = document.getElementById("noticeContent").value.trim();

    if(!title || !content){
        alert("공지 제목과 내용을 모두 입력해주세요.");
        return;
    }

    await addDoc(collection(db, "notices"), {
        title: title,
        content: content,
        writer: state.currentUser,
        createdAt: serverTimestamp()
    });

    document.getElementById("noticeTitle").value = "";
    document.getElementById("noticeContent").value = "";

    alert("공지사항이 등록되었습니다.");

};

export async function loadNotices(){

    const noticeList = document.getElementById("noticeList");

    noticeList.innerHTML = "";

    const q = query(
        collection(db, "notices"),
        orderBy("createdAt", "desc"),
        limit(3)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((docItem) => {

        const notice = docItem.data();

        const createdDate =
            notice.createdAt?.toDate?.().toLocaleDateString()
            || "날짜 없음";

        const div = document.createElement("div");

        div.style.background = "#374151";
        div.style.padding = "15px";
        div.style.borderRadius = "12px";

        div.style.cursor = "pointer";

        div.onclick = function(){
            showNoticeDetailPage(docItem.id);
        };

        div.innerHTML = `
            <strong>${notice.title}</strong>
            <div style="font-size:12px; color:#9ca3af; margin-top:4px;">
                ${createdDate}
            </div>
        `;

        noticeList.appendChild(div);

    });

}

window.loadNotices = loadNotices;

window.showNoticePage = function(){

    const main = document.querySelector(".main");

    main.innerHTML = `
        <div class="card">
            <h2>📢 공지사항 게시판</h2>
            <p style="color:#9ca3af; margin-top:8px;">
                공지 제목을 클릭하면 내용을 볼 수 있습니다.
            </p>

            <div
                id="noticeBoardList"
                style="display:flex; flex-direction:column; gap:12px; margin-top:20px;"
            ></div>

            ${state.currentRole === "admin" ? `
                <button
                    class="save-btn"
                    onclick="showNoticeWritePage()"
                    style="margin-top:20px;"
                >
                    ✍️ 글쓰기
                </button>
            ` : ""}
        </div>
    `;

    loadNoticeBoard();

};


window.loadNoticeBoard = async function(){

    const noticeBoardList = document.getElementById("noticeBoardList");

    noticeBoardList.innerHTML = "";

    const q = query(
        collection(db, "notices"),
        orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if(querySnapshot.empty){
        noticeBoardList.innerHTML = `
            <div style="background:#374151; padding:15px; border-radius:12px; color:#9ca3af;">
                등록된 공지사항이 없습니다.
            </div>
        `;
        return;
    }

    querySnapshot.forEach((docItem) => {

        const notice = docItem.data();

        const createdDate =
            notice.createdAt?.toDate?.().toLocaleDateString()
            || "날짜 없음";

        const div = document.createElement("div");

        div.style.background = "#374151";
        div.style.padding = "15px";
        div.style.borderRadius = "12px";
        div.style.cursor = "pointer";

        div.onclick = function(){
            showNoticeDetailPage(docItem.id);
        };

        div.innerHTML = `
            <strong style="font-size:18px;">${notice.title}</strong>
            <div style="font-size:12px; color:#9ca3af; margin-top:4px;">
                ${createdDate} / 작성자: ${notice.writer || "관리자"}
            </div>
        `;

        noticeBoardList.appendChild(div);

    });

};


window.showNoticeDetailPage = async function(noticeId){

    const docRef = doc(db, "notices", noticeId);
    const docSnap = await getDoc(docRef);

    if(!docSnap.exists()){
        alert("공지사항을 찾을 수 없습니다.");
        showNoticePage();
        return;
    }

    const notice = docSnap.data();

    const createdDate =
        notice.createdAt?.toDate?.().toLocaleDateString()
        || "날짜 없음";

    const main = document.querySelector(".main");

    main.innerHTML = `
        <div class="card">
            <button onclick="showNoticePage()" class="save-btn">
                ← 목록으로
            </button>

            <h2 style="margin-top:15px;">${notice.title}</h2>

            <div style="font-size:13px; color:#9ca3af; margin-top:8px;">
                ${createdDate} / 작성자: ${notice.writer || "관리자"}
            </div>

            <div style="margin-top:20px; background:#374151; padding:20px; border-radius:12px; white-space:pre-wrap; line-height:1.7;">
                ${notice.content}
            </div>

${state.currentRole === "admin" ? `
<div style="margin-top:20px; display:flex; gap:10px;">

    <button
        class="save-btn"
        onclick="editNotice('${noticeId}')"
    >
        ✏ 수정
    </button>

    <button
        class="save-btn"
        onclick="deleteNoticeConfirm('${noticeId}')"
        style="background:#dc2626;"
    >
        🗑 삭제
    </button>

</div>
` : ""}

        </div>
    `;

};


window.showNoticeWritePage = function(){

    if(state.currentRole !== "admin"){
        alert("관리자만 글쓰기가 가능합니다.");
        return;
    }

    const main = document.querySelector(".main");

    main.innerHTML = `
        <div class="card">
            <button onclick="showNoticePage()" class="save-btn">
                ← 목록으로
            </button>

            <h2 style="margin-top:15px;">✍ 공지사항 글쓰기</h2>

            <input
                id="noticeTitle"
                type="text"
                placeholder="공지 제목"
            />

            <textarea
                id="noticeContent"
                placeholder="공지 내용을 입력하세요"
            ></textarea>

            <button class="save-btn" onclick="saveNotice()">
                등록하기
            </button>
        </div>
    `;

};

window.editNotice = async function(noticeId){

    const docRef = doc(db, "notices", noticeId);
    const docSnap = await getDoc(docRef);

    if(!docSnap.exists()){
        alert("공지사항을 찾을 수 없습니다.");
        showNoticePage();
        return;
    }

    const notice = docSnap.data();

    const main = document.querySelector(".main");

    main.innerHTML = `
        <div class="card">
            <button onclick="showNoticeDetailPage('${noticeId}')" class="save-btn">
                ← 돌아가기
            </button>

            <h2 style="margin-top:15px;">✏ 공지사항 수정</h2>

            <input
                id="editNoticeTitle"
                type="text"
                value="${notice.title}"
            />

            <textarea id="editNoticeContent">${notice.content}</textarea>

            <button class="save-btn" onclick="updateNotice('${noticeId}')">
                수정 저장
            </button>
        </div>
    `;

};


window.updateNotice = async function(noticeId){

    const title = document.getElementById("editNoticeTitle").value.trim();
    const content = document.getElementById("editNoticeContent").value.trim();

    if(!title || !content){
        alert("제목과 내용을 모두 입력해주세요.");
        return;
    }

    await updateDoc(doc(db, "notices", noticeId), {
        title: title,
        content: content
    });

    alert("공지사항이 수정되었습니다.");

    showNoticeDetailPage(noticeId);

};


window.deleteNoticeConfirm = async function(noticeId){

    if(!confirm("이 공지사항을 삭제할까요?")){
        return;
    }

    await deleteDoc(doc(db, "notices", noticeId));

    alert("공지사항이 삭제되었습니다.");

    showNoticePage();

};
