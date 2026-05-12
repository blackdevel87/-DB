import {
    auth,
    secondaryAuth,
    db,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    doc,
    setDoc,
    getDoc
} from "./firebase-config.js";

import { state, adminAccounts } from "./state.js";


// ======================
// 로그인
// ======================

window.login = async function(){

    const id =
        document.getElementById("loginId")
        .value
        .trim();

    const code =
        document.getElementById("loginCode")
        .value
        .trim();

    const email = `${id}@tinyping.com`;

    try{

        await signInWithEmailAndPassword(
            auth,
            email,
            code
        );

    }
    catch(error){

        document.getElementById("loginMessage")
        .innerText =
        "아이디 또는 비밀번호가 틀렸습니다.";

    }

};


// ======================
// 로그인 유지
// ======================

onAuthStateChanged(auth,(user)=>{

    if(user){

        const id =
            user.email.split("@")[0];

        state.currentUser = id;

        state.currentRole =
            adminAccounts.includes(id)
            ? "admin"
            : "member";

        document.getElementById(
            "loginScreen"
        ).style.display = "none";

        updateRoleUI();

    }
    else{

        document.getElementById(
            "loginScreen"
        ).style.display = "flex";

    }

});


// ======================
// 로그아웃
// ======================

window.logout = async function(){

    await signOut(auth);

    location.reload();

};


// ======================
// UI 업데이트
// ======================

function updateRoleUI(){

    const roleName =
        document.getElementById("roleName");

    roleName.innerText =
        state.currentRole === "admin"
        ? "👑 관리자"
        : "👤 길드원";


    const adminItems =
        document.querySelectorAll(".admin-only");

    adminItems.forEach(item=>{

        item.style.display =
            state.currentRole === "admin"
            ? "block"
            : "none";

    });


    renderUserList();

}


// ======================
// 인원관리 열기
// ======================

window.showMemberTab = function(){

    document.getElementById(
        "memberManageTab"
    ).style.display = "block";

};


// ======================
// 계정 생성
// ======================

window.addUser = async function(){

    if(state.currentRole !== "admin"){

        alert("관리자만 가능합니다.");
        return;

    }

    const id =
        document.getElementById("newUserId")
        .value
        .trim();

    const password =
        document.getElementById("newUserCode")
        .value
        .trim();

    const role =
        document.getElementById("newUserRole")
        .value;

    if(!id || !password){

        alert("아이디와 비밀번호를 모두 입력해주세요.");
        return;

    }

    if(password.length < 6){

        alert("비밀번호는 6자리 이상이어야 합니다.");
        return;

    }

    if(state.users[id]){

        alert("이미 존재하는 계정입니다.");
        return;

    }

    const email = `${id}@tinyping.com`;

    try{

        await createUserWithEmailAndPassword(
            secondaryAuth,
            email,
            password
        );

        state.users[id] = {
            role: role
        };

        saveUsers();

        renderUserList();

        document.getElementById("newUserId").value = "";

        document.getElementById("newUserCode").value = "";

        alert("Firebase 계정 생성 완료!");

    }
    catch(error){

        console.log(error);

        if(error.code === "auth/email-already-in-use"){

            alert("이미 Firebase에 등록된 아이디입니다.");

        }
        else if(error.code === "auth/weak-password"){

            alert("비밀번호는 6자리 이상이어야 합니다.");

        }
        else{

            alert("계정 생성 중 오류가 발생했습니다.");

        }

    }

};


// ======================
// 계정 삭제
// ======================

window.deleteUser = function(id){

    if(id === state.currentUser){

        alert("현재 로그인 계정은 삭제 불가");
        return;

    }

    delete state.users[id];

    saveUsers();

    renderUserList();

};


// ======================
// 저장
// ======================

async function saveUsers(){

    await setDoc(

        doc(db, "guild", "users"),

        {
            users: state.users
        }

    );

}


// ======================
// 불러오기
// ======================

export async function loadUsers(){

    const docRef = doc(db, "guild", "users");

    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){

        state.users = docSnap.data().users;

    }

    renderUserList();

}


// ======================
// 유저 목록 출력
// ======================

function renderUserList(){

    const userList =
        document.getElementById("userList");

    userList.innerHTML = "";

    Object.keys(state.users).forEach(id=>{

        const user = state.users[id];

        const row =
            document.createElement("div");

        row.style.cssText =
            "display:flex;justify-content:space-between;align-items:center;background:#374151;padding:12px;border-radius:10px;margin-bottom:8px;";

        row.innerHTML = `

            <div>

                <strong>${id}</strong><br>

                <span style="font-size:13px;color:#d1d5db;">

                    권한 :
                    ${user.role === "admin"
                        ? "관리자"
                        : "길드원"}

                </span>

            </div>

            <button
                onclick="deleteUser('${id}')"
                style="
                    background:#dc2626;
                    color:white;
                    border:none;
                    border-radius:8px;
                    padding:8px 10px;
                    cursor:pointer;
                "
            >
                삭제
            </button>

        `;

        userList.appendChild(row);

    });

}
