<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>티니핑 길드 DB</title>

<link rel="stylesheet" href="css/style.css" />
</head>

<body>

<!-- 로그인 -->

<div id="loginScreen" class="login-screen">

    <div class="login-box">

        <h1>🎀 티니핑 길드 DB</h1>

        <input
            type="text"
            id="loginId"
            placeholder="아이디 입력"
        />

        <input
            type="password"
            id="loginCode"
            placeholder="비밀번호 입력"
        />

        <button onclick="login()">
            접속하기
        </button>

        <p
            id="loginMessage"
            style="margin-top:10px;color:#f87171;"
        ></p>

    </div>

</div>


<div class="layout">

    <!-- 사이드바 -->

    <aside class="sidebar">

        <h1>티니핑 길드 DB</h1>

        <p id="roleName">
            👤 길드원
        </p>

        <div class="menu">

 <button onclick="location.reload()">
    🏠 홈
</button>

<button onclick="showNoticePage()">
    📢 공지사항
</button>

<button onclick="showGuildAttackPage()">
    ⚔ 길드전 공격
</button>

<button>
    🛡 길드전 방어
</button>

<button onclick="showPvePage()">
    🧩 PVE 공략
</button>

<hr style="margin:20px 0; border-color:#374151;">

<button
    class="admin-only"
    onclick="showMemberTab()"
>
    👥 인원관리
</button>

<button onclick="logout()">
    🚪 로그아웃
</button>

        </div>

    </aside>


    <!-- 메인 -->

    <main class="main">

       <div class="card">
    <h2>👤 내 길드전 전적</h2>

    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:15px; margin-top:15px;">

        <div style="background:#374151; padding:15px; border-radius:12px;">
            <p style="color:#9ca3af;">시즌 승률</p>
            <h2>78%</h2>
        </div>

        <div style="background:#374151; padding:15px; border-radius:12px;">
            <p style="color:#9ca3af;">공격 횟수</p>
            <h2>24회</h2>
        </div>

        <div style="background:#374151; padding:15px; border-radius:12px;">
            <p style="color:#9ca3af;">MVP</p>
            <h2>5회</h2>
        </div>

        <div style="background:#374151; padding:15px; border-radius:12px;">
            <p style="color:#9ca3af;">최근 전적</p>
            <h2>승 / 승 / 패</h2>
        </div>

    </div>
</div>


<div class="card">
    <h2>⚡ 빠른 메뉴</h2>

    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:15px; margin-top:15px;">

        <button class="quick-btn">
            ⚔ 길드전 공격
        </button>

        <button class="quick-btn">
            🧩 PVE 공략
        </button>

        <button class="quick-btn">
            👥 길드원 목록
        </button>

        <button class="quick-btn">
            ✅ 출석체크
        </button>

    </div>
</div>


<div class="card">
    <h2>📢 공지사항</h2>

    <div
    id="noticeList"
    style="
        display:flex;
        flex-direction:column;
        gap:12px;
        margin-top:15px;
    "
></div>
</div>


        <!-- 관리자 전용 -->

        <div class="card admin-only">

            <h2>👑 관리자 전용 수정창</h2>

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
                저장하기
            </button>

        </div>


        <!-- 인원관리 -->

        <div
            id="memberManageTab"
            class="card admin-only"
            style="display:none;"
        >

            <h2>🔐 인원관리</h2>

            <p
                style="color:#9ca3af;margin-bottom:15px;"
            >
                관리자만 계정을 생성/삭제할 수 있습니다.
            </p>


            <input
                type="text"
                id="newUserId"
                placeholder="새 아이디"
            />

            <input
                type="password"
                id="newUserCode"
                placeholder="새 비밀번호"
            />


            <select id="newUserRole">

                <option value="member">
                    길드원
                </option>

                <option value="admin">
                    관리자
                </option>

            </select>


            <button
                class="save-btn"
                onclick="addUser()"
            >
                계정 생성
            </button>


            <h3 style="margin-top:25px;">
                현재 등록된 인원
            </h3>

            <div
                id="userList"
                style="margin-top:10px;"
            ></div>

        </div>

    </main>

</div>


<!-- Firebase + App Modules -->
<script type="module" src="js/main.js"></script>

</body>
</html>
