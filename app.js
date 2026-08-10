// ================================================================
// app.js — JT 방문자 관리 시스템 메인 기능 파일
// Supabase와 연동하여 방문자 등록/조회/삭제,
// 직원 목록 관리, 검색 기능을 처리합니다.
// ================================================================

// ──────────────────────────────────────────────────────────────
// [1] Supabase 연결 설정
//     Supabase와 대화할 수 있는 '클라이언트'를 만드는 코드입니다.
//     마치 데이터베이스로 연결되는 전화기를 만드는 것과 같습니다.
// ──────────────────────────────────────────────────────────────

// Supabase 프로젝트 주소 (URL)
const SUPABASE_URL = 'https://qzhgsshyhmnczmreagqd.supabase.co';

// Supabase 공개 키 (anon key) — 데이터베이스에 접근하기 위한 열쇠
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGdzc2h5aG1uY3ptcmVhZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzc0NzksImV4cCI6MjA5Nzg1MzQ3OX0.2NZxyClmIpj7WtUuZtexZqAMuTnC7udF5FejwitzvcU';

// Supabase 클라이언트 생성
// supabase 변수를 통해 데이터베이스에 읽기/쓰기를 할 수 있습니다.
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ──────────────────────────────────────────────────────────────
// [2] 앱 전체에서 사용하는 상태(State) 변수들
//     현재 앱의 상태를 기억하는 변수들입니다.
// ──────────────────────────────────────────────────────────────

// 전체 방문 기록 목록을 저장합니다 (배열)
let allVisitors = [];

// 검색 키워드를 저장합니다
let searchKeyword = '';

// 현재 선택된 탭 이름을 저장합니다
let currentTab = 'register';

// 삭제할 항목의 ID를 임시 저장합니다 (모달 확인 후 삭제에 사용)
let pendingDeleteId = null;
let pendingDeleteType = null; // 'visitor' 또는 'employee'

// ──────────────────────────────────────────────────────────────
// [3] 앱 시작 함수
//     웹 페이지가 완전히 로드된 후 가장 먼저 실행됩니다.
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ JT 방문자 관리 시스템 시작!');

  // 현재 시간을 헤더에 표시하고, 매 초마다 갱신합니다
  updateClock();
  setInterval(updateClock, 1000);

  // 방문 일시 입력창에 현재 날짜/시간을 기본값으로 설정합니다
  setDefaultDateTime();

  // Supabase에서 방문자 기록과 직원 목록을 불러옵니다
  loadVisitors();
  loadEmployees();
});

// ──────────────────────────────────────────────────────────────
// [4] 시계 업데이트 함수
//     헤더 오른쪽에 현재 날짜와 시간을 1초마다 표시합니다.
// ──────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();

  // 날짜 형식: 2026년 8월 10일 (일)
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
  const dateStr = now.toLocaleDateString('ko-KR', dateOptions);

  // 시간 형식: 오후 3:15:30
  const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  const timeStr = now.toLocaleTimeString('ko-KR', timeOptions);

  // HTML 요소에 표시
  const el = document.getElementById('current-time');
  if (el) {
    el.innerHTML = `${dateStr}<br><strong>${timeStr}</strong>`;
  }
}

// ──────────────────────────────────────────────────────────────
// [5] 방문 일시 기본값 설정
//     방문 일시 입력창을 현재 시간으로 미리 설정해 줍니다.
//     (사용자가 매번 날짜를 입력하는 번거로움을 줄여줍니다)
// ──────────────────────────────────────────────────────────────
function setDefaultDateTime() {
  const dateInput = document.getElementById('v-date');
  if (!dateInput) return;

  const now = new Date();
  // datetime-local 형식: "YYYY-MM-DDTHH:MM"
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  dateInput.value = `${year}-${month}-${day}T${hour}:${min}`;
}

// ──────────────────────────────────────────────────────────────
// [6] 탭 전환 함수
//     탭 버튼을 클릭하면 해당 탭의 내용을 보여줍니다.
// ──────────────────────────────────────────────────────────────
function switchTab(tabName) {
  currentTab = tabName;

  // 모든 탭 버튼에서 'active' 클래스를 제거합니다
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  // 모든 탭 패널(내용)을 숨깁니다
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // 클릭한 탭의 버튼과 패널만 활성화합니다
  const activeBtn = document.getElementById(`tab-${tabName}-btn`);
  const activePanel = document.getElementById(`tab-${tabName}`);

  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-selected', 'true');
  }
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // 기록 탭으로 이동할 때 최신 데이터를 다시 불러옵니다
  if (tabName === 'records') {
    loadVisitors();
  }

  // 직원 탭으로 이동할 때 직원 목록을 다시 불러옵니다
  if (tabName === 'employees') {
    loadEmployees();
  }
}

// ================================================================
//   VISITORS (방문자) 관련 함수들
// ================================================================

// ──────────────────────────────────────────────────────────────
// [7] 방문자 목록 불러오기 (Supabase → 화면)
//     Supabase 데이터베이스에서 방문 기록을 가져와 화면에 표시합니다.
// ──────────────────────────────────────────────────────────────
async function loadVisitors() {
  // 로딩 중 표시를 보여줍니다
  showVisitorState('loading');

  // Supabase의 visitors 테이블에서 모든 기록을 가져옵니다
  // .order() 는 최신 방문 기록이 위에 오도록 내림차순 정렬합니다
  const { data, error } = await db
    .from('visitors')
    .select('*')
    .order('visit_date', { ascending: false });

  // 오류가 발생하면 화면에 알려줍니다
  if (error) {
    console.error('방문자 로드 오류:', error);
    showToast('방문자 기록을 불러오는데 실패했습니다.', 'error');
    showVisitorState('empty');
    return;
  }

  // 불러온 데이터를 전역 변수에 저장합니다
  allVisitors = data || [];

  // 방문 기록 탭의 배지(건수)를 업데이트합니다
  const badge = document.getElementById('records-badge');
  if (badge) badge.textContent = allVisitors.length;

  // 검색어가 있으면 필터링하여 표시합니다
  renderVisitors(filterVisitors(allVisitors, searchKeyword));
}

// ──────────────────────────────────────────────────────────────
// [8] 방문자 카드 화면에 그리기 (렌더링)
//     JavaScript로 HTML을 동적으로 생성해 화면에 끼워 넣습니다.
// ──────────────────────────────────────────────────────────────
function renderVisitors(visitors) {
  const listEl = document.getElementById('records-list');
  if (!listEl) return;

  // 기록이 없으면 '빈 상태' 메시지를 표시합니다
  if (visitors.length === 0) {
    showVisitorState('empty');
    listEl.innerHTML = '';
    return;
  }

  // 기록이 있으면 목록을 표시합니다
  showVisitorState('list');

  // 각 방문자 데이터를 HTML 카드로 변환하여 연결합니다
  listEl.innerHTML = visitors.map(v => {
    // 방문 일시를 읽기 편한 형식으로 변환합니다
    const visitDateStr = formatDateTime(v.visit_date);

    // 연락처가 있을 때만 표시합니다
    const phoneHtml = v.phone
      ? `<span class="record-phone">📞 ${escapeHtml(v.phone)}</span>`
      : '';

    // 소속 회사가 있을 때만 태그를 만듭니다
    const companyTag = v.company
      ? `<span class="record-tag tag-company">🏢 ${escapeHtml(v.company)}</span>`
      : '';

    // 방문 목적이 있을 때만 태그를 만듭니다
    const purposeTag = v.purpose
      ? `<span class="record-tag tag-purpose">🎯 ${escapeHtml(v.purpose)}</span>`
      : '';

    // 최종 카드 HTML을 반환합니다
    return `
      <div class="record-card" id="record-${v.id}">
        <div class="record-info">
          <div class="record-name">👤 ${escapeHtml(v.name)}</div>
          ${phoneHtml}
          <div class="record-tags">
            ${companyTag}
            <span class="record-tag tag-employee">👔 ${escapeHtml(v.target_employee || '미지정')}</span>
            ${purposeTag}
          </div>
          <div class="record-date">📅 ${visitDateStr}</div>
        </div>
        <div class="record-actions">
          <!-- 삭제 버튼 클릭 시 confirmDelete 함수를 실행합니다 -->
          <button
            class="btn btn-icon-only"
            onclick="confirmDelete('${v.id}', 'visitor', '${escapeHtml(v.name)}님의 방문 기록')"
            title="삭제"
            aria-label="${escapeHtml(v.name)} 방문 기록 삭제"
          >🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// ──────────────────────────────────────────────────────────────
// [9] 방문자 로딩/빈상태/목록 전환 함수
// ──────────────────────────────────────────────────────────────
function showVisitorState(state) {
  const loadingEl = document.getElementById('records-loading');
  const emptyEl = document.getElementById('records-empty');
  const listEl = document.getElementById('records-list');

  if (loadingEl) loadingEl.style.display = state === 'loading' ? 'flex' : 'none';
  if (emptyEl) emptyEl.style.display = state === 'empty' ? 'flex' : 'none';
  if (listEl) listEl.style.display = state === 'list' ? 'flex' : 'none';
}

// ──────────────────────────────────────────────────────────────
// [10] 방문자 등록 처리 함수
//      폼에 입력된 데이터를 Supabase에 저장합니다.
// ──────────────────────────────────────────────────────────────
async function handleRegister(event) {
  // 폼의 기본 제출 동작(페이지 새로고침)을 막습니다
  event.preventDefault();

  // 입력 필드에서 값을 가져옵니다 (trim()은 앞뒤 공백 제거)
  const name = document.getElementById('v-name').value.trim();
  const phone = document.getElementById('v-phone').value.trim();
  const company = document.getElementById('v-company').value.trim();
  const purpose = document.getElementById('v-purpose').value.trim();
  const targetEmployee = document.getElementById('v-employee').value;
  const visitDate = document.getElementById('v-date').value;

  // 필수 항목이 비어있으면 등록을 막습니다
  if (!name) {
    showToast('방문자 이름을 입력해 주세요.', 'error');
    document.getElementById('v-name').focus();
    return;
  }
  if (!targetEmployee) {
    showToast('방문 대상 직원을 선택해 주세요.', 'error');
    document.getElementById('v-employee').focus();
    return;
  }
  if (!visitDate) {
    showToast('방문 일시를 선택해 주세요.', 'error');
    document.getElementById('v-date').focus();
    return;
  }

  // 버튼을 로딩 상태로 변경합니다 (중복 제출 방지)
  const btn = document.getElementById('register-btn');
  setButtonLoading(btn, true, '등록 중...');

  // Supabase visitors 테이블에 새 데이터를 추가합니다
  const { error } = await db.from('visitors').insert([{
    name,
    phone: phone || null,          // 빈 문자열은 null로 저장합니다
    company: company || null,
    purpose: purpose || null,
    target_employee: targetEmployee,
    visit_date: new Date(visitDate).toISOString(), // ISO 형식으로 변환
  }]);

  // 버튼을 원래 상태로 되돌립니다
  setButtonLoading(btn, false, '✅ 방문자 등록');

  if (error) {
    console.error('방문자 등록 오류:', error);
    showToast('등록 중 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    return;
  }

  // 성공! 알림을 표시하고 폼을 초기화합니다
  showToast(`${name}님의 방문이 등록되었습니다!`, 'success');
  document.getElementById('visitor-form').reset();
  setDefaultDateTime(); // 날짜/시간 기본값을 다시 설정합니다

  // 방문 기록 배지 숫자를 업데이트합니다
  await loadVisitors();
}

// ──────────────────────────────────────────────────────────────
// [11] 검색 처리 함수
//      검색창에 글자를 입력할 때마다 실시간으로 기록을 필터링합니다.
// ──────────────────────────────────────────────────────────────
function handleSearch() {
  const input = document.getElementById('search-input');
  searchKeyword = input ? input.value.trim() : '';

  // 검색어가 있으면 'X' 지우기 버튼을 표시합니다
  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) {
    clearBtn.style.display = searchKeyword ? 'block' : 'none';
  }

  // 검색어로 필터링된 결과를 화면에 표시합니다
  renderVisitors(filterVisitors(allVisitors, searchKeyword));
}

// ──────────────────────────────────────────────────────────────
// [12] 검색어 초기화 함수
// ──────────────────────────────────────────────────────────────
function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  searchKeyword = '';

  const clearBtn = document.getElementById('search-clear-btn');
  if (clearBtn) clearBtn.style.display = 'none';

  renderVisitors(allVisitors);
}

// ──────────────────────────────────────────────────────────────
// [13] 검색 필터링 함수
//      방문자 이름, 소속 회사, 방문 대상 직원에서 키워드를 검색합니다.
// ──────────────────────────────────────────────────────────────
function filterVisitors(visitors, keyword) {
  if (!keyword) return visitors;

  // 대소문자 구분 없이 검색하기 위해 소문자로 변환합니다
  const kw = keyword.toLowerCase();

  return visitors.filter(v =>
    (v.name && v.name.toLowerCase().includes(kw)) ||
    (v.company && v.company.toLowerCase().includes(kw)) ||
    (v.target_employee && v.target_employee.toLowerCase().includes(kw)) ||
    (v.purpose && v.purpose.toLowerCase().includes(kw)) ||
    (v.phone && v.phone.includes(kw))
  );
}

// ================================================================
//   EMPLOYEES (직원) 관련 함수들
// ================================================================

// ──────────────────────────────────────────────────────────────
// [14] 직원 목록 불러오기 (Supabase → 화면)
//      직원 탭과 방문자 등록 폼의 드롭다운 모두에 적용됩니다.
// ──────────────────────────────────────────────────────────────
async function loadEmployees() {
  // 로딩 중 표시
  showEmployeeState('loading');

  // Supabase employees 테이블에서 이름 순으로 정렬하여 가져옵니다
  const { data, error } = await db
    .from('employees')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('직원 로드 오류:', error);
    showToast('직원 목록을 불러오는데 실패했습니다.', 'error');
    showEmployeeState('empty');
    return;
  }

  const employees = data || [];

  // ① 직원 관리 탭의 카드 목록을 업데이트합니다
  renderEmployees(employees);

  // ② 방문자 등록 폼의 드롭다운도 업데이트합니다
  updateEmployeeDropdown(employees);
}

// ──────────────────────────────────────────────────────────────
// [15] 직원 카드 화면에 그리기
// ──────────────────────────────────────────────────────────────
function renderEmployees(employees) {
  const listEl = document.getElementById('employees-list');
  if (!listEl) return;

  if (employees.length === 0) {
    showEmployeeState('empty');
    listEl.innerHTML = '';
    return;
  }

  showEmployeeState('list');

  listEl.innerHTML = employees.map(emp => `
    <div class="employee-card" id="emp-${emp.id}">
      <div class="employee-info">
        <span class="employee-name">👤 ${escapeHtml(emp.name)}</span>
        ${emp.department ? `<span class="employee-dept">${escapeHtml(emp.department)}</span>` : ''}
      </div>
      <button
        class="btn btn-icon-only"
        onclick="confirmDelete('${emp.id}', 'employee', '${escapeHtml(emp.name)} 직원')"
        title="삭제"
        aria-label="${escapeHtml(emp.name)} 직원 삭제"
      >🗑️</button>
    </div>
  `).join('');
}

// ──────────────────────────────────────────────────────────────
// [16] 직원 등록 폼의 드롭다운 업데이트
//      직원 목록이 바뀔 때마다 선택 드롭다운도 함께 갱신합니다.
// ──────────────────────────────────────────────────────────────
function updateEmployeeDropdown(employees) {
  const select = document.getElementById('v-employee');
  if (!select) return;

  // 현재 선택된 값을 기억합니다
  const currentVal = select.value;

  // 기본 옵션만 남기고 나머지는 지웁니다
  select.innerHTML = '<option value="">직원을 선택하세요</option>';

  // 직원 목록을 옵션으로 추가합니다
  employees.forEach(emp => {
    const option = document.createElement('option');
    option.value = emp.name;
    option.textContent = emp.department
      ? `${emp.name} (${emp.department})`
      : emp.name;

    // 이전에 선택되어 있던 직원을 그대로 선택 상태로 유지합니다
    if (emp.name === currentVal) option.selected = true;

    select.appendChild(option);
  });
}

// ──────────────────────────────────────────────────────────────
// [17] 직원 추가 처리 함수
// ──────────────────────────────────────────────────────────────
async function handleAddEmployee(event) {
  event.preventDefault();

  const name = document.getElementById('e-name').value.trim();
  const dept = document.getElementById('e-dept').value.trim();

  if (!name) {
    showToast('직원 이름을 입력해 주세요.', 'error');
    document.getElementById('e-name').focus();
    return;
  }

  const btn = document.getElementById('add-employee-btn');
  setButtonLoading(btn, true, '추가 중...');

  // Supabase employees 테이블에 직원을 추가합니다
  const { error } = await db.from('employees').insert([{
    name,
    department: dept || null,
  }]);

  setButtonLoading(btn, false, '+ 직원 추가');

  if (error) {
    // 중복 이름 오류 처리 (UNIQUE 제약 위반)
    if (error.code === '23505') {
      showToast(`'${name}'은(는) 이미 등록된 직원입니다.`, 'error');
    } else {
      console.error('직원 추가 오류:', error);
      showToast('직원 추가 중 오류가 발생했습니다.', 'error');
    }
    return;
  }

  showToast(`${name} 직원이 추가되었습니다!`, 'success');

  // 폼을 초기화합니다
  document.getElementById('employee-form').reset();

  // 직원 목록을 다시 불러옵니다
  await loadEmployees();
}

// ──────────────────────────────────────────────────────────────
// [18] 직원 로딩/빈상태/목록 전환 함수
// ──────────────────────────────────────────────────────────────
function showEmployeeState(state) {
  const loadingEl = document.getElementById('employees-loading');
  const emptyEl = document.getElementById('employees-empty');
  const listEl = document.getElementById('employees-list');

  if (loadingEl) loadingEl.style.display = state === 'loading' ? 'flex' : 'none';
  if (emptyEl) emptyEl.style.display = state === 'empty' ? 'flex' : 'none';
  if (listEl) listEl.style.display = state === 'list' ? 'grid' : 'none';
}

// ================================================================
//   삭제 관련 함수들
// ================================================================

// ──────────────────────────────────────────────────────────────
// [19] 삭제 확인 모달 열기
//      실수로 삭제하는 것을 방지하기 위해 확인창을 먼저 보여줍니다.
// ──────────────────────────────────────────────────────────────
function confirmDelete(id, type, label) {
  pendingDeleteId = id;
  pendingDeleteType = type;

  // 모달의 설명 텍스트를 업데이트합니다
  const descEl = document.getElementById('modal-desc');
  if (descEl) descEl.textContent = `'${label}'을(를) 삭제하면 복구할 수 없습니다.`;

  // 확인 버튼 클릭 시 실제 삭제를 실행합니다
  const confirmBtn = document.getElementById('modal-confirm-btn');
  if (confirmBtn) {
    confirmBtn.onclick = () => executeDelete();
  }

  // 모달을 화면에 표시합니다
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

// ──────────────────────────────────────────────────────────────
// [20] 삭제 모달 닫기
// ──────────────────────────────────────────────────────────────
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
  pendingDeleteId = null;
  pendingDeleteType = null;
}

// ──────────────────────────────────────────────────────────────
// [21] 실제 삭제 실행 함수
//      모달에서 '삭제' 버튼을 눌렀을 때 Supabase에서 데이터를 지웁니다.
// ──────────────────────────────────────────────────────────────
async function executeDelete() {
  if (!pendingDeleteId || !pendingDeleteType) return;

  closeModal();

  if (pendingDeleteType === 'visitor') {
    // 방문자 기록 삭제
    const { error } = await db
      .from('visitors')
      .delete()
      .eq('id', pendingDeleteId); // id가 일치하는 행만 삭제

    if (error) {
      console.error('방문자 삭제 오류:', error);
      showToast('삭제 중 오류가 발생했습니다.', 'error');
      return;
    }

    showToast('방문 기록이 삭제되었습니다.', 'success');
    await loadVisitors();

  } else if (pendingDeleteType === 'employee') {
    // 직원 삭제
    const { error } = await db
      .from('employees')
      .delete()
      .eq('id', pendingDeleteId);

    if (error) {
      console.error('직원 삭제 오류:', error);
      showToast('삭제 중 오류가 발생했습니다.', 'error');
      return;
    }

    showToast('직원이 삭제되었습니다.', 'success');
    await loadEmployees();
  }
}

// ================================================================
//   유틸리티 (도우미) 함수들
// ================================================================

// ──────────────────────────────────────────────────────────────
// [22] 토스트 알림 표시 함수
//      화면 오른쪽 하단에 잠깐 나타났다 사라지는 알림창입니다.
//      type: 'success'(초록), 'error'(빨강), 'info'(파랑)
// ──────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // 아이콘 매핑
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  // 토스트 엘리먼트를 만듭니다
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '📌'}</span><span>${message}</span>`;

  container.appendChild(toast);

  // 3초 후에 토스트를 부드럽게 사라지게 합니다
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ──────────────────────────────────────────────────────────────
// [23] 버튼 로딩 상태 전환 함수
//      버튼을 클릭했을 때 '처리 중...' 상태로 바꿔줍니다.
// ──────────────────────────────────────────────────────────────
function setButtonLoading(btn, isLoading, defaultText) {
  if (!btn) return;
  btn.disabled = isLoading;
  const textEl = btn.querySelector('.btn-text') || btn;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    textEl.textContent = defaultText;
  } else {
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// [24] 날짜/시간 포맷 함수
//      "2026-08-10T10:00:00+09:00" → "2026년 8월 10일 오전 10:00"
// ──────────────────────────────────────────────────────────────
function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  });
}

// ──────────────────────────────────────────────────────────────
// [25] XSS 방지 함수 (보안)
//      사용자가 입력한 텍스트를 안전하게 HTML에 삽입합니다.
//      악의적인 스크립트가 실행되지 않도록 특수문자를 변환합니다.
// ──────────────────────────────────────────────────────────────
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 앱 준비 완료 메시지
console.log('🏢 JT 방문자 관리 시스템 — app.js 로드 완료');
