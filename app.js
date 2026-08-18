/*
  app.js — JT 방문자 관리 시스템 메인 로직
  4단계 위자드 방식으로 완전히 재작성되었습니다.

  전체 구조:
  1. Supabase 연결 설정
  2. 위자드 상태 관리 (currentStep, formData)
  3. 위자드 단계 이동 함수 (goStep, validateStep)
  4. 버튼 선택 함수 (selectPurpose, selectYN, selectFitness)
  5. 서명 패드 초기화 및 관리
  6. 저장 함수 (handleSave)
  7. 기록 조회/표시 함수
  8. 직원 관리 함수
  9. 공통 유틸리티 (toast, modal, 시간 표시 등)
*/

// =====================================================================
// 1. Supabase 연결 설정
// =====================================================================
// Supabase는 우리 데이터베이스 역할을 하는 서비스입니다.
// URL과 Key는 Supabase 대시보드에서 확인할 수 있습니다.
const SUPABASE_URL = 'https://qzhgsshyhmnczmreagqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6aGdzc2h5aG1uY3ptcmVhZ3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNzc0NzksImV4cCI6MjA5Nzg1MzQ3OX0.2NZxyClmIpj7WtUuZtexZqAMuTnC7udF5FejwitzvcU';

// Supabase 클라이언트 객체를 만듭니다 (이것을 통해 DB에 접근합니다)
const { createClient } = supabase;
// 탭이나 브라우저를 닫으면 로그인이 풀리도록(sessionStorage) 설정 추가
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,
  }
});

// =====================================================================
// 2. 위자드 상태 관리
// =====================================================================
// 현재 몇 번째 단계에 있는지 추적합니다 (1~4)
let currentStep = 1;

// 사용자가 입력한 모든 폼 데이터를 한 곳에 모아 보관합니다
let formData = {};

// 서명 패드 객체 (SignaturePad 라이브러리로 만들 예정)
let visitorSigPad = null;
let guideSigPad = null;

// 삭제 모달에서 실제로 삭제할 ID를 임시 저장합니다
let pendingDeleteId = null;
let pendingDeleteType = null; // 'visitor' 또는 'employee'

// 현재 화면에 표시 중인 방문 기록 (검색 필터링용)
let allRecords = [];

// =====================================================================
// 인증(로그인) 전역 상태
// =====================================================================
// currentUser: 로그인한 직원 정보. 로그인 안 했으면 null
let currentUser = null;

// 페이지 로드 시 항상 로그아웃 상태로 시작 + 헤더 UI 갱신 (새로고침 시 로그인 풀림)
function initAuth() {
  currentUser = null;
  updateAuthUI();
}

// 헤더의 로그인/로그아웃 영역을 현재 상태에 맞게 갱신
function updateAuthUI() {
  const section = document.getElementById('user-auth-section');
  if (!section) return;

  if (currentUser) {
    section.innerHTML = `
      <span style="color:var(--text-secondary); font-size:0.85rem; white-space:nowrap;">
        <strong style="color:var(--text-main);">${escapeHtml(currentUser.name)}</strong>
        <span style="color:var(--primary-color);">(${escapeHtml(currentUser.role)})</span>님
      </span>
      <button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.78rem; white-space:nowrap;" onclick="logout()">
        로그아웃
      </button>
    `;
  } else {
    section.innerHTML = `
      <button class="btn btn-ghost" style="padding:0.25rem 0.6rem; font-size:0.78rem; white-space:nowrap; color:var(--primary-color);" onclick="openAuthModal('login')">
        🔐 로그인
      </button>
    `;
  }

  // 권한에 따른 관리자 탭 노출 제어
  const adminTabBtn = document.getElementById('tab-admin-btn');
  if (adminTabBtn) {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
      adminTabBtn.style.display = 'flex';
    } else {
      adminTabBtn.style.display = 'none';
    }
  }
}

// =====================================================================
// 3. 페이지가 처음 로드될 때 실행되는 초기화 함수
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  // 현재 날짜/시간을 헤더에 표시
  startClock();

  // Step 1의 날짜/시간 입력란에 현재 값을 자동으로 채워줍니다
  setDefaultDateTime();

  // 서명 패드를 초기화합니다
  initSignaturePads();

  // Supabase에서 직원 목록을 불러옵니다 (안내자/승인자 드롭다운용)
  loadEmployees();

  // 저장된 로그인 정보 불러오기 & 헤더 UI 갱신
  initAuth();

  // 초기 탭 데이터를 불러옵니다
  if (document.getElementById('tab-approval').classList.contains('active')) {
    loadPendingApprovals();
  }
});

// =====================================================================
// 탭 전환 기능
// =====================================================================
function switchTab(tabId) {
  // 결재 승인 탭은 누구나 접근 가능 (보기는 모두 가능)
  // 다만 승인/반려 결재 버튼은 모달 오픈 시에 권한 체크
  // 모든 탭 버튼과 패널의 활성화 상태 해제
  document.querySelectorAll('.tab-btn, .nav-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
    panel.style.display = 'none';
  });

  // 선택한 탭 버튼과 패널 활성화
  const targetBtn = document.getElementById(`tab-${tabId}-btn`);
  const targetPanel = document.getElementById(`tab-${tabId}`);
  
  if (targetBtn) {
    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');
  }
  if (targetPanel) {
    targetPanel.classList.add('active');
    targetPanel.style.display = 'block';
  }

  // 탭별 데이터 로드
  if (tabId === 'approval') {
    loadPendingApprovals();
  }
  if (tabId === 'archive') {
    loadArchiveApprovals();
  }
  if (tabId === 'trash') {
    loadTrash();
  }
  if (tabId === 'audit') {
    loadAuditLog();
  }
  if (tabId === 'ledger') {
    // 이번 달 1일부터 오늘까지를 기본 날짜로 설정
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // YYYY-MM-DD 포맷
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    document.getElementById('ledger-start-date').value = formatDate(firstDay);
    document.getElementById('ledger-end-date').value = formatDate(today);
    
    loadLedger();
  }
  if (tabId === 'admin') {
    loadAdminEmployees();
  }

  // 페이지 제목 변경
  const titles = { register: '방문자 등록', approval: '결재 승인 대기열', archive: '적합/부적합 보관함', ledger: '관리대장 출력', admin: '관리자' };
  const pageTitle = document.getElementById('page-title');
  if (pageTitle) pageTitle.textContent = titles[tabId] || '';
}

// =====================================================================
// 4. 현재 날짜/시간 자동 입력
// =====================================================================
function setDefaultDateTime() {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 만들어 날짜 입력란에 넣습니다
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const dd   = String(now.getDate()).padStart(2, '0');
  const hh   = String(now.getHours()).padStart(2, '0');
  const min  = String(now.getMinutes()).padStart(2, '0');

  const dateInput = document.getElementById('s1-date');
  const timeInput = document.getElementById('s1-time');
  if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
  if (timeInput) timeInput.value = `${hh}:${min}`;
}

// =====================================================================
// 5. 헤더 시계 (1초마다 업데이트)
// =====================================================================
function startClock() {
  function updateTime() {
    const el = document.getElementById('current-time');
    if (!el) return;
    const now = new Date();
    // 한국어 날짜+시간 형식으로 표시
    el.innerHTML = now.toLocaleString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
      weekday: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  updateTime();
  setInterval(updateTime, 1000); // 1초마다 갱신
}



// =====================================================================
// 7. 서명 패드 초기화
// =====================================================================
// SignaturePad 라이브러리를 사용해 캔버스를 서명 입력 도구로 만듭니다
function initSignaturePads() {
  // 방문자 서명 캔버스
  const visitorCanvas = document.getElementById('visitor-signature-canvas');
  if (visitorCanvas) {
    // 캔버스 실제 픽셀 크기를 화면 크기에 맞게 조정합니다 (선명하게 표시)
    resizeCanvas(visitorCanvas);
    visitorSigPad = new SignaturePad(visitorCanvas, {
      backgroundColor: 'rgba(255,255,255,0.95)', // 흰색 배경
      penColor: '#1e293b'                          // 서명 색 (진한 남색)
    });
  }

  // 안내자 서명 캔버스
  const guideCanvas = document.getElementById('guide-signature-canvas');
  if (guideCanvas) {
    resizeCanvas(guideCanvas);
    guideSigPad = new SignaturePad(guideCanvas, {
      backgroundColor: 'rgba(255,255,255,0.95)',
      penColor: '#1e293b'
    });
  }

  // 창 크기가 바뀔 때(모바일 스크롤 포함) 캔버스를 다시 조정하면서 기존 서명 데이터 복구
  window.addEventListener('resize', () => {
    if (visitorCanvas) {
      let vData = null;
      if (typeof visitorSigPad !== 'undefined' && visitorSigPad) vData = visitorSigPad.toData();
      resizeCanvas(visitorCanvas);
      if (vData && visitorSigPad) visitorSigPad.fromData(vData);
    }
    if (guideCanvas) {
      let gData = null;
      if (typeof guideSigPad !== 'undefined' && guideSigPad) gData = guideSigPad.toData();
      resizeCanvas(guideCanvas);
      if (gData && guideSigPad) guideSigPad.fromData(gData);
    }
  });
}

// 캔버스 크기를 실제 표시 크기에 맞게 설정하는 함수
function resizeCanvas(canvas) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width  = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);
}

// 서명 지우기 버튼 클릭 시 호출됩니다
function clearSignature(who) {
  if (who === 'visitor' && visitorSigPad) visitorSigPad.clear();
  if (who === 'guide' && guideSigPad) guideSigPad.clear();
}

// 서명 되돌리기(Undo) 버튼 클릭 시 호출됩니다
function undoSignature(who) {
  const pad = who === 'visitor' ? visitorSigPad : guideSigPad;
  if (pad) {
    const data = pad.toData();
    if (data && data.length > 0) {
      data.pop(); // 마지막 획 제거
      pad.fromData(data);
    }
  }
}

// =====================================================================
// 8. 위자드 단계 이동
// =====================================================================
function goStep(targetStep) {
  // 앞으로 가는 경우에는 유효성 검사를 먼저 실행합니다
  if (targetStep > currentStep) {
    if (!validateStep(currentStep)) return; // 검사 실패 시 이동 중단
    collectStepData(currentStep);          // 현재 단계 데이터 수집
  }

  // 이전 단계는 숨기고 새 단계를 표시합니다
  document.getElementById(`step-${currentStep}`)?.classList.remove('active');
  document.getElementById(`step-${targetStep}`)?.classList.add('active');

  // 프로그레스 바 업데이트
  updateProgressBar(targetStep);

  currentStep = targetStep;

  // Step 4로 이동할 때 직원 목록을 드롭다운에 다시 채웁니다
  if (targetStep === 4) {
    populateEmployeeDropdowns();
  }

  // 캔버스는 화면에 보이지 않을 때(display: none) 크기가 0이 되어 서명이 깨집니다.
  // 탭이 활성화되어 화면에 나타난 직후에 캔버스 크기를 정확히 다시 계산해주어야 합니다.
  setTimeout(() => {
    if (targetStep === 3 && visitorSigPad && visitorSigPad.isEmpty()) {
      resizeCanvas(document.getElementById('visitor-signature-canvas'));
      visitorSigPad.clear();
    }
    if (targetStep === 4 && guideSigPad && guideSigPad.isEmpty()) {
      resizeCanvas(document.getElementById('guide-signature-canvas'));
      guideSigPad.clear();
    }
  }, 50);

  // 위로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 프로그레스 바 상태 업데이트 함수
function updateProgressBar(activeStep) {
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`prog-${i}`);
    if (!stepEl) continue;
    stepEl.classList.remove('active', 'done');
    if (i < activeStep)      stepEl.classList.add('done');   // 지나온 단계
    else if (i === activeStep) stepEl.classList.add('active'); // 현재 단계
  }

  // 연결선도 업데이트
  for (let i = 1; i <= 3; i++) {
    const lineEl = document.getElementById(`line-${i}-${i+1}`);
    if (!lineEl) continue;
    if (i < activeStep) lineEl.classList.add('active');
    else               lineEl.classList.remove('active');
  }
}

// =====================================================================
// 9. 각 단계별 유효성 검사 (필수 항목이 모두 채워졌는지 확인)
// =====================================================================
function validateStep(step) {
  if (step === 1) {
    // 날짜
    if (!document.getElementById('s1-date').value) {
      showToast('방문 일자를 입력해 주세요.', 'error'); return false;
    }
    // 시간
    if (!document.getElementById('s1-time').value) {
      showToast('방문 시간을 입력해 주세요.', 'error'); return false;
    }
    // 이름
    if (!document.getElementById('s1-name').value.trim()) {
      showToast('방문자 이름을 입력해 주세요.', 'error'); return false;
    }
    // 방문 목적 버튼 선택 여부
    const purposeSelected = document.querySelector('.purpose-btn.selected');
    if (!purposeSelected) {
      showToast('방문 목적을 선택해 주세요.', 'error'); return false;
    }
    // '기타' 선택 시 사유 입력 여부
    if (purposeSelected.dataset.value === '기타') {
      if (!document.getElementById('s1-purpose-other').value.trim()) {
        showToast('기타 방문 사유를 입력해 주세요.', 'error'); return false;
      }
    }
    return true;
  }

  if (step === 2) {
    // Q1~Q5 모두 선택했는지 확인
    for (let i = 1; i <= 5; i++) {
      const answered = document.querySelector(`.yn-btn[data-q="health_q${i}"].selected`);
      if (!answered) {
        showToast(`건강 체크 ${i}번 문항에 답변해 주세요.`, 'error'); return false;
      }
    }
    return true;
  }

  if (step === 3) {
    // 준수사항 Q1~Q5 모두 선택했는지 확인
    for (let i = 1; i <= 5; i++) {
      const answered = document.querySelector(`.yn-btn[data-q="compliance_q${i}"].selected`);
      if (!answered) {
        showToast(`준수사항 ${i}번 항목에 동의 여부를 선택해 주세요.`, 'error'); return false;
      }
    }
    // 방문자 서명 여부 확인
    if (!visitorSigPad || visitorSigPad.isEmpty()) {
      showToast('방문자 서명을 해 주세요.', 'error'); return false;
    }
    return true;
  }

  return true; // Step 4는 저장 시 검사
}

// =====================================================================
// 10. 현재 단계의 데이터를 formData 객체에 수집
// =====================================================================
function collectStepData(step) {
  if (step === 1) {
    const purposeBtn = document.querySelector('.purpose-btn.selected');
    formData.visit_date          = document.getElementById('s1-date').value;
    formData.visit_time          = document.getElementById('s1-time').value;
    formData.visitor_name        = document.getElementById('s1-name').value.trim();
    formData.visitor_company     = document.getElementById('s1-company').value.trim();
    formData.visit_purpose       = purposeBtn ? purposeBtn.dataset.value : '';
    formData.visit_purpose_other = document.getElementById('s1-purpose-other').value.trim();
  }

  if (step === 2) {
    // 예/아니오 버튼 선택 결과를 true/false로 변환합니다
    for (let i = 1; i <= 5; i++) {
      const selected = document.querySelector(`.yn-btn[data-q="health_q${i}"].selected`);
      formData[`health_q${i}`] = selected ? (selected.dataset.val === 'true') : false;
    }
  }

  if (step === 3) {
    for (let i = 1; i <= 5; i++) {
      const selected = document.querySelector(`.yn-btn[data-q="compliance_q${i}"].selected`);
      formData[`compliance_q${i}`] = selected ? (selected.dataset.val === 'true') : false;
    }
    // 서명은 이미지 데이터(PNG Base64)로 저장합니다
    formData.visitor_signature = visitorSigPad && !visitorSigPad.isEmpty()
      ? visitorSigPad.toDataURL()
      : '';
  }
}

// =====================================================================
// 11. 방문 목적 버튼 선택
// =====================================================================
function selectPurpose(btn) {
  // 모든 방문 목적 버튼에서 선택 표시 제거
  document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));
  // 클릭된 버튼에 선택 표시
  btn.classList.add('selected');

  // '기타'를 선택한 경우에만 직접 입력란을 보여줍니다
  const otherGroup = document.getElementById('purpose-other-group');
  if (btn.dataset.value === '기타') {
    otherGroup.style.display = 'block';
  } else {
    otherGroup.style.display = 'none';
    document.getElementById('s1-purpose-other').value = '';
  }
}

// =====================================================================
// 12. 예/아니오 버튼 선택
// =====================================================================
function selectYN(btn) {
  // 같은 문항(data-q)의 다른 버튼에서 선택 표시 제거
  const q = btn.dataset.q;
  document.querySelectorAll(`.yn-btn[data-q="${q}"]`).forEach(b => b.classList.remove('selected'));
  // 클릭된 버튼에 선택 표시
  btn.classList.add('selected');
}

// =====================================================================
// 13. 적합/부적합 버튼 선택
// =====================================================================


// =====================================================================
// 14. 취소 버튼 → 위자드 초기화
// =====================================================================
function cancelWizard() {
  if (!confirm('입력한 내용이 모두 사라집니다. 정말 취소할까요?')) return;
  resetWizard();
}

function resetWizard() {
  // 모든 formData 초기화
  formData = {};
  currentStep = 1;

  // 모든 단계 숨기고 Step 1만 보이기
  document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-1')?.classList.add('active');
  updateProgressBar(1);

  // Step 1 입력 초기화
  setDefaultDateTime();
  document.getElementById('s1-name').value = '';
  document.getElementById('s1-company').value = '';
  document.getElementById('s1-purpose-other').value = '';
  document.getElementById('purpose-other-group').style.display = 'none';
  document.querySelectorAll('.purpose-btn').forEach(b => b.classList.remove('selected'));

  // Step 2,3 예/아니오 버튼 초기화
  document.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('selected'));

  // 서명 지우기
  if (visitorSigPad) visitorSigPad.clear();
  if (guideSigPad)   guideSigPad.clear();

  // Step 4 초기화
  document.getElementById('s4-remarks').value = '';
  document.getElementById('s4-guide').value = '';
  document.getElementById('s4-approver').value = '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =====================================================================
// 15. 저장 버튼 클릭 → Supabase에 데이터 저장
// =====================================================================
async function handleSave() {
  // Step 4 유효성 검사
  const fitnessSelected = document.querySelector('.yn-btn[data-q="fitness_status"].selected');
  const guideEl    = document.getElementById('s4-guide');
  const approverEl = document.getElementById('s4-approver');

  if (!fitnessSelected) {
    showToast('안내자의 적합 여부를 선택해 주세요.', 'error'); return;
  }
  if (!guideEl.value) {
    showToast('안내자를 선택해 주세요.', 'error'); return;
  }
  if (!guideSigPad || guideSigPad.isEmpty()) {
    showToast('안내자 서명을 해 주세요.', 'error'); return;
  }

  // Step 4 데이터 수집
  formData.guide_name      = guideEl.value;
  formData.guide_signature = guideSigPad.toDataURL();
  formData.remarks         = document.getElementById('s4-remarks').value.trim();
  formData.approver_name   = approverEl.value;
  formData.approval_status = '대기';
  formData.fitness_status  = fitnessSelected.dataset.val;

  // 저장 버튼을 비활성화 (중복 클릭 방지)
  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>저장 중...</span>';

  try {
    // Supabase visitors 테이블에 데이터를 삽입하고 생성된 ID를 반환받습니다
    const { data, error } = await db.from('visitors').insert([formData]).select();

    if (error) throw error;

    if (data && data.length > 0) {
      await logAction(data[0].id, 'CREATED', '방문자 정보 등록');
    }

    showToast('✅ 방문자 등록이 완료되었습니다!', 'success');
    resetWizard();
  } catch (err) {
    console.error('저장 오류:', err);
    showToast('저장 중 오류가 발생했습니다: ' + err.message, 'error');
  } finally {
    // 버튼 원상복귀
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾 저장</span>';
  }
}

// =====================================================================
// 16. 직원 목록 불러오기 (드롭다운 연동용)
// =====================================================================
async function loadEmployees() {
  try {
    const { data, error } = await db
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const employees = data || [];
    // Step 4의 드롭다운 업데이트
    updateEmployeeDropdowns(employees);
  } catch (err) {
    console.error('직원 불러오기 오류:', err);
  }
}

// 직원 드롭다운(안내자, 승인자)을 직원 목록으로 채우는 함수
function updateEmployeeDropdowns(employees) {
  const guideSelect    = document.getElementById('s4-guide');
  const approverSelect = document.getElementById('s4-approver');

  // 역할에 따라 직원 목록 분류
  // role 컬럼이 없는 기존 데이터는 안내자로 취급
  const guides    = employees.filter(e => !e.role || ['안내자', '안내자+승인자', 'admin', 'superadmin'].includes(e.role));
  const approvers = employees.filter(e => ['승인자', '안내자+승인자', 'admin', 'superadmin'].includes(e.role));

  // 특정 select 요소를 특정 목록으로 채우는 내부 함수
  function fillSelect(select, list) {
    if (!select) return;
    const currentVal = select.value;
    while (select.options.length > 1) select.remove(1);
    list.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.name;
      let display = e.name;
      if (e.department) {
        display += ` (${e.department}`;
        if (e.title) display += ` ${e.title}`;
        display += `)`;
      } else if (e.title) {
        display += ` (${e.title})`;
      }
      opt.textContent = display;
      select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
  }

  fillSelect(guideSelect, guides);
  fillSelect(approverSelect, approvers);
}

// Step 4로 이동할 때 최신 직원 목록을 드롭다운에 채웁니다
async function populateEmployeeDropdowns() {
  try {
    const { data, error } = await db
      .from('employees')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) updateEmployeeDropdowns(data);
  } catch (e) {
    console.error('직원 드롭다운 갱신 오류:', e);
  }
}



// =====================================================================
// 21. 토스트 알림 표시 (성공/오류 메시지 팝업)
// =====================================================================
// type: 'success' | 'error' | 'info'
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // 아이콘 설정
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  // 3초 후 자동으로 사라집니다
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// =====================================================================
// 22. XSS 방지용 HTML 이스케이프 함수
// =====================================================================
// 사용자가 입력한 텍스트를 그대로 HTML에 넣으면 보안 취약점이 생길 수 있습니다.
// 이 함수는 특수 문자를 안전한 형태로 변환합니다.
function escapeHtml(text) {
  if (typeof text !== 'string') return text || '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
// =====================================================================
// 결재 승인 로직 (신규)
// =====================================================================
let currentApprovalRecordId = null;

async function loadPendingApprovals() {
  const loading = document.getElementById('approval-loading');
  const empty = document.getElementById('approval-empty');
  const list = document.getElementById('approval-list');
  const badge = document.getElementById('approval-badge');

  if (!loading || !empty || !list || !badge) return;

  loading.style.display = 'flex';
  empty.style.display = 'none';
  list.innerHTML = '';

  try {
    const { data, error } = await db
      .from('visitors')
      .select('*')
      .eq('approval_status', '대기')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    badge.textContent = data.length.toString();

    if (data.length === 0) {
      empty.style.display = 'flex';
    } else {
      data.forEach(record => {
        // 결재 권한 여부 확인 (승인자 또는 안내자+승인자)
        const canApprove = currentUser &&
          (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin');

        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-header">
            <h3 class="record-name">${record.visitor_name || record.name || '이름 없음'} <span class="tag tag-pending">승인 대기</span></h3>
            <span class="record-date">${record.visit_date} ${record.visit_time || ''}</span>
          </div>
          <div class="record-body">
            <p><strong>회사:</strong> ${record.visitor_company || record.company || 'N/A'} &nbsp; <strong>목적:</strong> ${record.visit_purpose || record.purpose || ''}</p>
            <p><strong>안내자:</strong> ${record.guide_name || '미지정'} &nbsp; <strong>평가:</strong> ${
              record.fitness_status === '적합' 
                ? '<span style="display:inline-block; background:#047857; color:#fff; border:1.5px solid #047857; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle;">적합</span>' 
                : record.fitness_status === '부적합' 
                  ? '<span style="display:inline-block; background:#B91C1C; color:#fff; border:1.5px solid #B91C1C; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle;">부적합</span>' 
                  : '<span style="color:var(--text-muted);">미선택</span>'
            }</p>
          </div>
          <div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">
            <!-- 상세보기: 누구나 (모달에 결재버튼 없음) -->
            <button class="btn btn-ghost" style="flex:1; min-width:120px;"
              onclick="showApprovalDetail('${record.id}', 'view')">
              🔍 상세 보기
            </button>
            <!-- 결재: 승인자 권한만 (모달에 결재버튼 있음) -->
            ${canApprove
              ? `<button class="btn btn-primary" style="flex:1; min-width:120px;"
                  onclick="showApprovalDetail('${record.id}', 'approve')">
                  ✅ 결재하기
                </button>`
              : `<button class="btn btn-ghost" style="flex:1; min-width:120px; opacity:0.45; cursor:not-allowed;"
                  title="승인자 권한이 필요합니다" disabled>
                  🔒 결재 (권한없음)
                </button>`
            }
            ${canApprove
              ? `<button class="btn btn-ghost" style="padding: 0 0.5rem; color:var(--danger);" title="삭제"
                  onclick="softDeleteRecord('${record.id}')">
                  🗑️
                </button>`
              : ``
            }
          </div>
        `;
        list.appendChild(card);
      });
    }
  } catch (err) {
    console.error('승인 목록 불러오기 오류:', err);
    showToast('대기 목록을 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

let currentArchiveFilter = 'all'; // 전체, 승인, 반려

// 보관함 목록 로드 (승인 또는 반려된 건들)
async function loadArchiveApprovals(filter = 'all') {
  currentArchiveFilter = filter;
  
  // 전체 버튼 기본 뱃지 스타일 (비활성 시 은은한 배경)
  const btnAll = document.getElementById('filter-all');
  btnAll.classList.remove('btn-primary');
  btnAll.classList.add('btn-ghost');
  btnAll.style.background = 'rgba(255,255,255,0.05)';
  btnAll.style.color = 'var(--text-primary)';
  btnAll.style.border = '1.5px solid rgba(255,255,255,0.2)';

  // 적합 버튼 기본 뱃지 스타일 (비활성 시 연한 초록)
  const btnApp = document.getElementById('filter-approved');
  btnApp.classList.remove('btn-primary');
  btnApp.classList.add('btn-ghost');
  btnApp.style.background = 'var(--success-light)';
  btnApp.style.color = 'var(--success)';
  btnApp.style.border = '1.5px solid var(--success)';

  // 부적합 버튼 기본 뱃지 스타일 (비활성 시 연한 빨강)
  const btnRej = document.getElementById('filter-rejected');
  btnRej.classList.remove('btn-primary');
  btnRej.classList.add('btn-ghost');
  btnRej.style.background = 'var(--danger-light)';
  btnRej.style.color = 'var(--danger)';
  btnRej.style.border = '1.5px solid var(--danger)';
  
  // 활성화된 버튼 스타일 적용
  if (filter === 'all') {
    btnAll.classList.replace('btn-ghost', 'btn-primary');
    btnAll.style.background = '#000';
    btnAll.style.color = '#fff';
    btnAll.style.border = '1.5px solid #000';
  }
  if (filter === '승인') {
    btnApp.classList.remove('btn-ghost');
    btnApp.style.background = '#047857';
    btnApp.style.color = '#fff';
    btnApp.style.border = '1.5px solid #047857';
  }
  if (filter === '반려') {
    btnRej.classList.remove('btn-ghost');
    btnRej.style.background = '#B91C1C';
    btnRej.style.color = '#fff';
    btnRej.style.border = '1.5px solid #B91C1C';
  }

  const loading = document.getElementById('archive-loading');
  const empty = document.getElementById('archive-empty');
  const list = document.getElementById('archive-list');

  if (!loading || !empty || !list) return;

  loading.style.display = 'flex';
  empty.style.display = 'none';
  list.innerHTML = '';

  try {
    let query = db
      .from('visitors')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filter === 'all') {
      query = query.neq('approval_status', '대기');
    } else {
      query = query.eq('approval_status', filter);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data.length === 0) {
      empty.style.display = 'flex';
    } else {
      data.forEach(record => {
        // 결재 권한 여부 확인 (상태 수정 버튼 표시에 사용)
        const canApprove = currentUser &&
          (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin');

        const isApproved = record.approval_status === '승인';
        const statusTag = isApproved 
          ? `<span class="tag tag-approved" style="display:inline-block; background:#047857; color:#fff; border:1.5px solid #047857; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle; margin-left:0.5rem;">적합(승인)</span>` 
          : `<span class="tag tag-rejected" style="display:inline-block; background:#B91C1C; color:#fff; border:1.5px solid #B91C1C; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle; margin-left:0.5rem;">부적합(반려)</span>`;

        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-header">
            <h3 class="record-name">${record.visitor_name || record.name || '이름 없음'} ${statusTag}</h3>
            <span class="record-date">${record.visit_date} ${record.visit_time || ''}</span>
          </div>
          <div class="record-body">
            <p><strong>회사:</strong> ${record.visitor_company || record.company || 'N/A'} &nbsp; <strong>목적:</strong> ${record.visit_purpose || record.purpose || ''}</p>
            <p><strong>안내자:</strong> ${record.guide_name || '미지정'} &nbsp; <strong>평가:</strong> ${
              record.fitness_status === '적합' 
                ? '<span style="display:inline-block; background:#047857; color:#fff; border:1.5px solid #047857; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle;">적합</span>' 
                : record.fitness_status === '부적합' 
                  ? '<span style="display:inline-block; background:#B91C1C; color:#fff; border:1.5px solid #B91C1C; border-radius:20px; padding:0.2rem 0.6rem; font-size:0.75rem; vertical-align:middle;">부적합</span>' 
                  : '<span style="color:var(--text-muted);">미선택</span>'
            }</p>
          </div>
          <div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">
            <!-- 상세보기 (수정 불가능한 보기 모드) -->
            <button class="btn btn-ghost" style="flex:1; min-width:120px;"
              onclick="showApprovalDetail('${record.id}', 'view')">
              🔍 상세 보기
            </button>
            <!-- 상태 수정 (권한이 있는 사람만) -->
            ${canApprove
              ? `<button class="btn btn-secondary" style="flex:1; min-width:120px;"
                  onclick="showApprovalDetail('${record.id}', 'edit')">
                  ✏️ 상태 변경
                </button>
                <button class="btn btn-ghost" style="padding: 0 0.5rem; color:var(--danger);" title="삭제"
                  onclick="softDeleteRecord('${record.id}')">
                  🗑️
                </button>`
              : `<button class="btn btn-ghost" style="flex:1; min-width:120px; opacity:0.45; cursor:not-allowed;"
                  title="상태 변경은 승인자만 가능합니다" disabled>
                  🔒 변경 (권한없음)
                </button>`
            }
          </div>
        `;
        list.appendChild(card);
      });
    }
  } catch (err) {
    console.error('보관함 목록 불러오기 오류:', err);
    showToast('보관함 목록을 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

// 보관함 기록 삭제 (권한자만 가능)
async function deleteArchiveRecord(id) {
  if (!confirm('정말 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.')) return;

  try {
    const { data, error } = await db
      .from('visitors')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      showToast('삭제 권한이 없거나 이미 삭제되었습니다. (DB RLS 삭제 정책을 확인하세요)', 'error');
      return;
    }
    
    showToast('기록이 삭제되었습니다.', 'success');
    loadArchiveApprovals(currentArchiveFilter);
  } catch (err) {
    console.error('기록 삭제 중 오류:', err);
    showToast('기록 삭제 중 오류가 발생했습니다.', 'error');
  }
}

async function showApprovalDetail(id, mode = 'view') {
  try {
    const { data, error } = await db
      .from('visitors')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // data가 없어도 에러를 던지지 않고 null 반환

    if (error) throw error;
    if (!data) {
      showToast('해당 방문자 기록을 찾을 수 없습니다.', 'error');
      return;
    }

    currentApprovalRecordId = id;
    
    // ── 응답값을 뱃지로 변환하는 헬퍼 함수 ──
    // isYesGood: true면 '예'가 좋은 답변, false면 '아니오'가 좋은 답변
    function badge(val, isYesGood = true) {
      const isYes = val === true;
      const isGood = isYesGood ? isYes : !isYes;
      const label = isYes ? '예' : '아니오';
      const color = isGood
        ? 'background:var(--success); color:#fff;'
        : 'background:var(--danger); color:#fff;';
      return `<span style="display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.8rem; font-weight:600; ${color}">${label}</span>`;
    }

    // ── 건강 점검 질문 목록 (아니오가 정상 = isYesGood: false) ──
    const healthQuestions = [
      { key: 'health_q1', text: '최근 1주일 내 감염병(감기, 눈병 등)에 걸린 적이 있나요?', isYesGood: false },
      { key: 'health_q2', text: '현재 소화기 증상(설사, 복통 등)이 있나요?', isYesGood: false },
      { key: 'health_q3', text: '피부질환(고름, 심한 습진 등)이 있나요?', isYesGood: false },
      { key: 'health_q4', text: '인화물, 음식물, 위생용품을 소지하고 있나요?', isYesGood: false },
      { key: 'health_q5', text: '탈락 위험이 있는 장신구(반지 등)를 착용하고 있나요?', isYesGood: false },
    ];

    // ── 준수사항 질문 목록 (예가 정상 = isYesGood: true) ──
    const complianceQuestions = [
      { key: 'compliance_q1', text: '본 시설은 엄격한 위생 관리가 필요한 화장품 생산 구역으로 입실 전 반드시 지정된 위생복과 위생화, 위생모를 착용하고 철저한 손 소독을 실시해야 합니다.', isYesGood: true },
      { key: 'compliance_q2', text: '생산 구역 내에서는 음식물 섭취 및 흡연을 엄격히 금지하며, 이물 혼입 방지를 위해 반지, 시계 등 모든 개인 장신구의 착용이 제한됩니다.', isYesGood: true },
      { key: 'compliance_q3', text: '방문 시 안내자의 지시에 따라 지정된 동선으로만 이동해야 이동해야 하며, 허가되지 않은 생산 설비나 원료를 임의로 조작하거나 접촉하지 않습니다.', isYesGood: true },
      { key: 'compliance_q4', text: '시설 내부의 모든 촬영 및 녹취는 금지되며, 방문을 통해 취득한 기술 정보나 영업 비밀을 외부에 유출하지 않을 것을 약속합니다.', isYesGood: true },
      { key: 'compliance_q5', text: '위 수칙을 위반하거나 관리자의 정당한 통제에 따르지 않을 경우 출입이 제한될 수 있음을 숙지하고 이에 동의합니다.', isYesGood: true },
    ];

    // 문제 있는 항목(비정상 응답)이 있는지 확인
    const healthIssues = healthQuestions.filter(q => data[q.key] === true); // 건강은 '예'가 문제
    const complianceIssues = complianceQuestions.filter(q => data[q.key] === false); // 준수사항은 '아니오'가 문제

    // 건강 점검 행 렌더링
    const healthRows = healthQuestions.map(q =>
      `<tr style="${data[q.key] === true ? 'background:rgba(239,68,68,0.08);' : ''}">
        <td style="padding:0.5rem 0.25rem; font-size:0.85rem; color:var(--text-secondary); vertical-align:middle;">${q.text}</td>
        <td style="padding:0.5rem 0.5rem; text-align:center; white-space:nowrap; vertical-align:middle;">${badge(data[q.key], q.isYesGood)}</td>
      </tr>`
    ).join('');

    // 준수사항 행 렌더링
    const complianceRows = complianceQuestions.map(q =>
      `<tr style="${data[q.key] === false ? 'background:rgba(239,68,68,0.08);' : ''}">
        <td style="padding:0.5rem 0.25rem; font-size:0.85rem; color:var(--text-secondary); vertical-align:middle;">${q.text}</td>
        <td style="padding:0.5rem 0.5rem; text-align:center; white-space:nowrap; vertical-align:middle;">${badge(data[q.key], q.isYesGood)}</td>
      </tr>`
    ).join('');

    const sectionStyle = 'background:var(--bg); padding:1rem; border-radius:var(--radius-md);';
    const h4Style = 'margin:0 0 0.75rem 0; font-size:1rem;';

    const body = document.getElementById('approval-modal-body');
    body.innerHTML = `
      <div style="display:grid; gap:1rem;">

        <!-- 방문자 기본 정보 -->
        <div style="${sectionStyle}">
          <h4 style="${h4Style}">📋 방문자 정보</h4>
          <p><strong>이름:</strong> ${escapeHtml(data.visitor_name || data.name || '이름 없음')} (${escapeHtml(data.visitor_company || data.company || '소속 없음')})</p>
          <p><strong>방문 일시:</strong> ${data.visit_date} ${data.visit_time || ''}</p>
          <p><strong>방문 목적:</strong> ${escapeHtml(data.visit_purpose || data.purpose || '')}${data.visit_purpose_other ? ' - ' + escapeHtml(data.visit_purpose_other) : ''}</p>
        </div>

        <!-- 건강 상태 점검 -->
        <div style="${sectionStyle}">
          <h4 style="${h4Style}">
            🏥 Step 2. 건강 상태 자가점검
            <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted); margin-left:0.5rem;">
              (모두 <strong style="color:var(--success);">아니오</strong>여야 정상)
            </span>
          </h4>
          ${healthIssues.length > 0
            ? `<div style="margin-bottom:0.75rem; padding:0.5rem 0.75rem; background:var(--danger-light); border-left:3px solid var(--danger); border-radius:4px; font-size:0.85rem; color:var(--danger);">
                ⚠️ 비정상 응답 ${healthIssues.length}개 항목이 있습니다. 확인이 필요합니다.
               </div>`
            : `<div style="margin-bottom:0.75rem; padding:0.5rem 0.75rem; background:var(--success-light); border-left:3px solid var(--success); border-radius:4px; font-size:0.85rem; color:var(--success);">
                ✅ 모든 항목이 정상입니다.
               </div>`
          }
          <table style="width:100%; border-collapse:collapse;">
            <tbody>${healthRows}</tbody>
          </table>
        </div>

        <!-- 준수사항 및 보안 동의 -->
        <div style="${sectionStyle}">
          <h4 style="${h4Style}">
            📜 Step 3. 준수사항 및 보안 동의
            <span style="font-size:0.8rem; font-weight:400; color:var(--text-muted); margin-left:0.5rem;">
              (모두 <strong style="color:var(--success);">예</strong>여야 정상)
            </span>
          </h4>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:0.75rem;">
            아래 수칙을 숙지하고 동의(예)했는지 확인합니다.
          </p>
          ${complianceIssues.length > 0
            ? `<div style="margin-bottom:0.75rem; padding:0.5rem 0.75rem; background:var(--danger-light); border-left:3px solid var(--danger); border-radius:4px; font-size:0.85rem; color:var(--danger);">
                ⚠️ 미동의 항목 ${complianceIssues.length}개가 있습니다. 확인이 필요합니다.
               </div>`
            : `<div style="margin-bottom:0.75rem; padding:0.5rem 0.75rem; background:var(--success-light); border-left:3px solid var(--success); border-radius:4px; font-size:0.85rem; color:var(--success);">
                ✅ 모든 항목에 동의하였습니다.
               </div>`
          }
          <table style="width:100%; border-collapse:collapse;">
            <tbody>${complianceRows}</tbody>
          </table>
        </div>

        <!-- 방문자 서명 -->
        <div style="${sectionStyle}">
          <h4 style="${h4Style}">✍️ 방문자 서명</h4>
          ${data.visitor_signature
            ? `<div style="background:white; display:inline-block; padding:0.25rem; border-radius:4px; border:1px solid var(--border-color);">
                <img src="${data.visitor_signature}" alt="방문자 서명" style="max-height:100px; display:block;">
               </div>`
            : `<p style="color:var(--text-muted); font-size:0.9rem;">서명 없음</p>`
          }
        </div>

        <!-- 안내자 확인 -->
        <div style="${sectionStyle}">
          <h4 style="${h4Style}">👤 안내자 확인</h4>
          <p><strong>안내자 평가(적합 여부):</strong> ${
            data.fitness_status === '적합' 
              ? badge(true, true).replace('예', '적합') 
              : data.fitness_status === '부적합' 
                ? badge(false, true).replace('아니오', '부적합') 
                : '<span style="color:var(--text-muted);">미선택</span>'
          }</p>
          <p><strong>안내자:</strong> ${escapeHtml(data.guide_name || '미지정')}</p>
          <p><strong>특이사항:</strong> ${escapeHtml(data.remarks || '없음')}</p>
          ${data.guide_signature
            ? `<div style="margin-top:0.5rem;">
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.25rem;">안내자 서명:</p>
                <div style="background:white; display:inline-block; padding:0.25rem; border-radius:4px; border:1px solid var(--border-color);">
                  <img src="${data.guide_signature}" alt="안내자 서명" style="max-height:80px; display:block;">
                </div>
               </div>`
            : ''
          }
        </div>

      </div>
      <!-- 타임라인 이력이 표시될 영역 -->
      <div id="timeline-container"></div>
    `;

    document.getElementById('approval-modal').style.display = 'flex';
    
    // 타임라인 데이터 불러와서 채우기
    renderTimeline(id, document.getElementById('timeline-container'));

    // ── 결재 버튼 및 상태 수정 버튼 제어 ──
    const actionsEl = document.getElementById('approval-modal-actions');
    if (actionsEl) {
      if (mode === 'approve' || mode === 'edit') {
        const hasApproveRole = currentUser &&
          (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin');

        if (hasApproveRole) {
          actionsEl.style.display = 'flex';
          actionsEl.style.justifyContent = 'flex-end';
          actionsEl.style.gap = '0.5rem';
          
          if (mode === 'approve') {
            actionsEl.innerHTML = `
              <button class="btn btn-danger" onclick="submitApproval('반려')">❌ 부적합 (반려)</button>
              <button class="btn btn-primary" onclick="submitApproval('승인')">✅ 적합 (승인)</button>
            `;
          } else if (mode === 'edit') {
            // 보관함에서 상태 수정 모드일 때
            const isApproved = data.approval_status === '승인';
            const toggleTo = isApproved ? '반려' : '승인';
            const toggleBtnText = isApproved ? '❌ 부적합(반려)으로 변경' : '✅ 적합(승인)으로 변경';
            const btnClass = isApproved ? 'btn-danger' : 'btn-primary';

            const isFitnessSuitable = data.fitness_status === '적합';
            const toggleFitnessTo = isFitnessSuitable ? '부적합' : '적합';
            const toggleFitnessBtnText = isFitnessSuitable ? '❌ 부적합으로 변경' : '✅ 적합으로 변경';
            const fitnessBtnClass = isFitnessSuitable ? 'btn-danger' : 'btn-primary';
            
            actionsEl.style.display = 'block';
            actionsEl.innerHTML = `
              <div style="display:flex; flex-direction:column; gap:0.5rem; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--color-bg-layout); padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--border-color);">
                  <span style="font-size:0.85rem; color:var(--text-secondary);">안내자 평가 (현재: <strong style="color:var(--text-main);">${data.fitness_status || '미선택'}</strong>)</span>
                  <button class="btn ${fitnessBtnClass}" style="padding:0.3rem 0.75rem; font-size:0.85rem;" onclick="submitFitnessChange('${toggleFitnessTo}')">${toggleFitnessBtnText}</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--color-bg-layout); padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--border-color);">
                  <span style="font-size:0.85rem; color:var(--text-secondary);">최종 결재 (현재: <strong style="color:var(--text-main);">${data.approval_status}</strong>)</span>
                  <button class="btn ${btnClass}" style="padding:0.3rem 0.75rem; font-size:0.85rem;" onclick="submitApproval('${toggleTo}')">${toggleBtnText}</button>
                </div>
              </div>
            `;
          }
        } else {
          actionsEl.style.display = 'block';
          actionsEl.innerHTML = `
            <div style="text-align:center; padding:0.75rem; background:rgba(255,200,0,0.1);
              border:1px solid rgba(255,200,0,0.3); border-radius:8px;
              color:var(--text-secondary); font-size:0.9rem;">
              🔒 권한이 부족합니다.
            </div>
          `;
        }
      } else {
        // mode === 'view' 이면 액션 영역 숨김
        actionsEl.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('상세 정보 불러오기 오류:', err);
    showToast('상세 정보를 불러올 수 없습니다.', 'error');
  }
}

function closeApprovalModal() {
  document.getElementById('approval-modal').style.display = 'none';
  currentApprovalRecordId = null;
}

async function submitApproval(decision) {
  if (!currentApprovalRecordId) return;

  // 승인/반려 시 권한 재확인 (이중 방어)
  const hasApproveRole = currentUser &&
    (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin');
  if (!hasApproveRole) {
    showToast('결재 권한이 없습니다.', 'error');
    return;
  }

  const confirmMsg = decision === '승인' 
    ? '이 방문자를 "적합(승인)" 처리하시겠습니까?'
    : '이 방문자를 "부적합(반려)" 처리하시겠습니까?';

  if (!confirm(confirmMsg)) return;

  try {
    const { error } = await db
      .from('visitors')
      .update({
        approval_status: decision,
        approved_at: new Date().toISOString()
      })
      .eq('id', currentApprovalRecordId);

    if (error) throw error;
    
    // 이력 로깅
    const actionEnum = decision === '승인' ? 'APPROVED' : 'REJECTED';
    await logAction(currentApprovalRecordId, actionEnum, decision + ' 처리됨');

    showToast(`방문자가 성공적으로 ${decision} 처리되었습니다.`, 'success');
    closeApprovalModal();
    
    // 현재 활성화된 탭에 따라 리스트 새로고침
    const activeTabPanel = document.querySelector('.tab-panel.active');
    if (activeTabPanel && activeTabPanel.id === 'tab-archive') {
      loadArchiveApprovals();
    } else {
      loadPendingApprovals();
    }
  } catch (err) {
    console.error('결재 처리 오류:', err);
    showToast('결재 처리 중 오류가 발생했습니다.', 'error');
  }
}

async function submitFitnessChange(decision) {
  if (!currentApprovalRecordId) return;

  const hasApproveRole = currentUser &&
    (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin');
  if (!hasApproveRole) {
    showToast('권한이 없습니다.', 'error');
    return;
  }

  const confirmMsg = decision === '적합' 
    ? '안내자 평가를 "적합"으로 변경하시겠습니까?'
    : '안내자 평가를 "부적합"으로 변경하시겠습니까?';

  if (!confirm(confirmMsg)) return;

  try {
    const { error } = await db
      .from('visitors')
      .update({
        fitness_status: decision
      })
      .eq('id', currentApprovalRecordId);

    if (error) throw error;

    showToast(`안내자 평가가 성공적으로 ${decision}(으)로 변경되었습니다.`, 'success');
    
    // 모달을 다시 열어서 변경된 상태를 보여줌
    showApprovalDetail(currentApprovalRecordId, 'edit');
    
    // 현재 활성화된 탭에 따라 리스트 새로고침
    const activeTabPanel = document.querySelector('.tab-panel.active');
    if (activeTabPanel && activeTabPanel.id === 'tab-archive') {
      loadArchiveApprovals(currentArchiveFilter);
    } else {
      loadPendingApprovals();
    }
  } catch (err) {
    console.error('평가 변경 처리 오류:', err);
    showToast('평가 변경 처리 중 오류가 발생했습니다.', 'error');
  }
}

// =====================================================================
// 관리자 탭 기능
// =====================================================================

// ── 비밀번호를 SHA-256으로 해시하는 함수 ──
// SHA-256은 단방향 암호화입니다. 해시값으로 원래 비밀번호를
// 역으로 알아낼 수 없어서 Supabase에 저장해도 안전합니다.
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Supabase에서 저장된 비밀번호 해시 가져오기 ──
async function getAdminPasswordHash() {
  try {
    const { data, error } = await db
      .from('settings')
      .select('value')
      .eq('key', 'admin_password_hash')
      .single();
    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}


// 관리자 비밀번호 변경 (SHA-256 해시 후 Supabase에 저장)
async function changeAdminPassword() {
  const newPw  = document.getElementById('new-password')?.value;
  const newPw2 = document.getElementById('new-password-confirm')?.value;

  if (!newPw || newPw.length < 4) {
    showToast('비밀번호는 4자 이상이어야 합니다.', 'error'); return;
  }
  if (newPw !== newPw2) {
    showToast('비밀번호가 일치하지 않습니다.', 'error'); return;
  }

  try {
    const newHash = await hashPassword(newPw);

    // Supabase settings 테이블에 upsert (있으면 수정, 없으면 삽입)
    const { error } = await db
      .from('settings')
      .upsert({ key: 'admin_password_hash', value: newHash, updated_at: new Date().toISOString() });

    if (error) throw error;

    showToast('✅ 비밀번호가 변경되어 서버에 안전하게 저장되었습니다!', 'success');
    document.getElementById('new-password').value = '';
    document.getElementById('new-password-confirm').value = '';
  } catch (err) {
    console.error('비밀번호 변경 오류:', err);
    showToast('비밀번호 변경 중 오류가 발생했습니다.', 'error');
  }
}

// ── 관리자 탭: 직원 목록 불러오기 ──
async function loadAdminEmployees() {
  const loading = document.getElementById('admin-emp-loading');
  const empty   = document.getElementById('admin-emp-empty');
  const list    = document.getElementById('admin-employee-list');
  if (!list) return;

  if (loading) loading.style.display = 'flex';
  if (empty)   empty.style.display   = 'none';
  list.innerHTML = '';

  try {
    const { data, error } = await db
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      if (empty) empty.style.display = 'flex';
    } else {
      // 1. 직원 목록 카드 렌더링
      data.forEach(emp => {
        const role = emp.role || '안내자';
        const badgeClass = role === '안내자' ? 'role-guide'
                         : role === '승인자' ? 'role-approver'
                         : 'role-both';
        const badgeIcon  = role === '안내자' ? '🔵'
                         : role === '승인자' ? '🟢'
                         : '🟣';

        const card = document.createElement('div');
        card.className = 'employee-card';
        card.innerHTML = `
          <div class="employee-info">
            <div class="employee-name">${escapeHtml(emp.name)} <span style="font-size:0.85rem; color:var(--text-muted); font-weight:normal;">${emp.title ? escapeHtml(emp.title) : ''}</span></div>
            <div class="employee-dept">${emp.department ? escapeHtml(emp.department) : '부서 없음'}</div>
            <span class="role-badge ${badgeClass}">${badgeIcon} ${role}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <button class="btn btn-ghost" style="flex-shrink:0; font-size:0.8rem; padding:0.4rem 0.5rem; color:var(--text-secondary);"
              onclick="openEditModal('${emp.id}', '${escapeHtml(emp.name).replace(/'/g, "\\'")}', '${emp.department ? escapeHtml(emp.department).replace(/'/g, "\\'") : ''}', '${emp.title ? escapeHtml(emp.title).replace(/'/g, "\\'") : ''}', '${role}')">
              ✏️ 수정
            </button>
            <button class="btn btn-ghost" style="flex-shrink:0; font-size:0.8rem; padding:0.4rem 0.5rem; color:var(--danger);"
              onclick="handleDeleteEmployee('${emp.id}', '${escapeHtml(emp.name).replace(/'/g, "\\'")}')">
              🗑️ 삭제
            </button>
          </div>
        `;
        list.appendChild(card);
      });

      // 2. 부서 select 박스 채우기
      const deptSelect = document.getElementById('e-dept-select');
      if (deptSelect) {
        // 기존 옵션 유지하되, 중간 부서 목록만 초기화
        deptSelect.innerHTML = `
          <option value="">부서 없음</option>
          <option value="direct">➕ 새 부서 직접입력...</option>
        `;
        const uniqueDepts = [...new Set(data.map(e => e.department).filter(Boolean))].sort();
        uniqueDepts.forEach(dept => {
          const opt = document.createElement('option');
          opt.value = dept;
          opt.textContent = dept;
          // '직접입력' 옵션 바로 앞에 추가
          deptSelect.insertBefore(opt, deptSelect.lastElementChild);
        });
      }
    }
  } catch (err) {
    console.error('직원 목록 불러오기 오류:', err);
    showToast('직원 목록을 불러오는 중 오류가 발생했습니다.', 'error');
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

// ── 관리자 탭: 직원 추가 ──
async function handleAddEmployee(event) {
  event.preventDefault();

  const name = document.getElementById('e-name')?.value.trim();
  const title = document.getElementById('e-title')?.value.trim() || null;
  
  // 부서 처리: select 값이 'direct'면 input에서 가져오고, 아니면 select 값 사용
  const deptSelectVal = document.getElementById('e-dept-select')?.value;
  let dept = deptSelectVal;
  if (deptSelectVal === 'direct') {
    dept = document.getElementById('e-dept-input')?.value.trim();
  } else {
    dept = deptSelectVal?.trim();
  }

  const role = document.getElementById('e-role')?.value || '안내자';

  if (!name) { showToast('이름을 입력해 주세요.', 'error'); return; }

  const btn = document.getElementById('add-employee-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span>저장 중...</span>'; }

  try {
    // 1. 이미 동일한 이름의 직원이 있는지 조회
    const { data: existingEmp, error: searchError } = await db
      .from('employees')
      .select('*')
      .eq('name', name)
      .maybeSingle(); // 0개 또는 1개 결과 반환

    if (searchError) throw searchError;

    if (existingEmp) {
      // 2. 이미 존재하는 경우: 역할 비교 후 병합 처리
      const existingRole = existingEmp.role || '안내자';
      
      if (existingRole === '안내자+승인자' || role === '안내자+승인자') {
        // 이미 겸직이거나 새 역할이 겸직이면 그냥 겸직으로 업데이트
        const { error: updateError } = await db
          .from('employees')
          .update({ role: '안내자+승인자', department: dept || existingEmp.department, title: title || existingEmp.title })
          .eq('id', existingEmp.id);
        if (updateError) throw updateError;
        showToast(`ℹ️ [${name}] 님은 이미 등록되어 겸직(안내자+승인자)으로 통합되었습니다.`, 'success');
        
      } else if (existingRole !== role) {
        // 기존 역할과 새 역할이 다르면 (안내자 vs 승인자) -> 겸직으로 승급
        const { error: updateError } = await db
          .from('employees')
          .update({ role: '안내자+승인자', department: dept || existingEmp.department, title: title || existingEmp.title })
          .eq('id', existingEmp.id);
        if (updateError) throw updateError;
        showToast(`🎉 [${name}] 님이 안내자+승인자로 승급(병합)되었습니다!`, 'success');
        
      } else {
        // 완전히 동일한 역할로 다시 등록하는 경우
        showToast(`이미 [${role}] 역할을 가진 동일한 이름의 직원이 있습니다.`, 'error');
        return;
      }
    } else {
      // 3. 없는 경우: 새로 인서트
      const { error: insertError } = await db.from('employees').insert([{ name, department: dept || null, title: title || null, role }]);
      if (insertError) throw insertError;
      showToast(`✅ ${name} (${role}) 직원이 신규 등록되었습니다!`, 'success');
    }

    // 성공 시 공통 처리 (폼 초기화 및 목록 갱신)
    document.getElementById('e-name').value = '';
    document.getElementById('e-title').value = '';
    const deptSelect = document.getElementById('e-dept-select');
    if (deptSelect) deptSelect.value = '';
    const deptInput = document.getElementById('e-dept-input');
    if (deptInput) {
      deptInput.value = '';
      deptInput.style.display = 'none';
    }
    document.getElementById('e-role').value = '안내자';
    
    loadAdminEmployees();
    loadEmployees(); // 위자드 드롭다운 갱신
  } catch (err) {
    console.error('직원 등록 오류:', err);
    showToast('직원 등록 중 오류가 발생했습니다: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span>+ 등록하기</span>'; }
  }
}

// ── 관리자 탭: 직원 삭제 ──
async function handleDeleteEmployee(id, name) {
  if (!confirm(`"${name}" 직원을 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`)) return;

  try {
    const { error } = await db.from('employees').delete().eq('id', id);
    if (error) throw error;

    showToast(`"${name}" 직원이 삭제되었습니다.`, 'success');
    loadAdminEmployees();
    loadEmployees(); // 위자드 드롭다운도 갱신
  } catch (err) {
    console.error('직원 삭제 오류:', err);
    showToast('삭제 중 오류가 발생했습니다.', 'error');
  }
}

// ── 비밀번호 보이기/숨기기 토글 ──
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈'; // 숨기기 아이콘
  } else {
    input.type = 'password';
    btn.textContent = '👁️'; // 보이기 아이콘
  }
}

// ── 부서 직접입력 토글 ──
function toggleDeptInput() {
  const select = document.getElementById('e-dept-select');
  const input = document.getElementById('e-dept-input');
  if (select && input) {
    if (select.value === 'direct') {
      input.style.display = 'block';
      input.focus();
    } else {
      input.style.display = 'none';
      input.value = '';
    }
  }
}

// ── 관리자 탭: 직원 정보 수정 모달 열기 ──
function openEditModal(id, name, dept, title, role) {
  const modal = document.getElementById('edit-employee-modal');
  if (!modal) return;
  
  document.getElementById('edit-e-id').value = id;
  document.getElementById('edit-e-name').value = name;
  document.getElementById('edit-e-dept').value = dept;
  document.getElementById('edit-e-title').value = title;
  document.getElementById('edit-e-role').value = role;
  
  modal.style.display = 'flex';
}

// ── 관리자 탭: 직원 정보 수정 모달 닫기 ──
function closeEditModal() {
  const modal = document.getElementById('edit-employee-modal');
  if (modal) modal.style.display = 'none';
}

// ── 관리자 탭: 직원 정보 수정 제출 ──
async function submitEditEmployee(event) {
  event.preventDefault();
  
  const id = document.getElementById('edit-e-id')?.value;
  const name = document.getElementById('edit-e-name')?.value.trim();
  const dept = document.getElementById('edit-e-dept')?.value.trim() || null;
  const title = document.getElementById('edit-e-title')?.value.trim() || null;
  const role = document.getElementById('edit-e-role')?.value;
  
  if (!id || !name) return;
  
  const btn = document.getElementById('submit-edit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  
  try {
    const { error } = await db
      .from('employees')
      .update({ name, department: dept, title, role })
      .eq('id', id);
      
    if (error) throw error;
    
    showToast(`✅ [${name}] 직원 정보가 수정되었습니다.`, 'success');
    closeEditModal();
    loadAdminEmployees();
    loadEmployees(); // 드롭다운 갱신
  } catch (err) {
    console.error('직원 수정 오류:', err);
    showToast('직원 정보를 수정하는 중 오류가 발생했습니다.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  }
}

// =====================================================================
// 직원 로그인 / 회원가입 로직
// =====================================================================
let currentAuthMode = 'login';

function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
}

function setAuthMode(mode) {
  currentAuthMode = mode;
  const loginBtn = document.getElementById('btn-auth-login');
  const signupBtn = document.getElementById('btn-auth-signup');
  const title = document.getElementById('auth-modal-title');
  const desc = document.getElementById('auth-desc');
  const submitBtn = document.getElementById('submit-auth-btn');
  const pwLabel = document.getElementById('auth-pw-label');
  const hint = document.getElementById('auth-name-hint');

  if (mode === 'login') {
    loginBtn.style.borderBottom = '2px solid var(--primary-color)';
    loginBtn.style.color = 'var(--text-main)';
    signupBtn.style.borderBottom = 'none';
    signupBtn.style.color = 'var(--text-muted)';
    
    title.textContent = '🔐 직원 로그인';
    desc.textContent = '결재를 위해 이름을 입력하고 로그인하세요.';
    pwLabel.innerHTML = '비밀번호 <span class="required">*</span>';
    submitBtn.textContent = '로그인';
    if(hint) hint.style.display = 'none';
  } else {
    signupBtn.style.borderBottom = '2px solid var(--primary-color)';
    signupBtn.style.color = 'var(--text-main)';
    loginBtn.style.borderBottom = 'none';
    loginBtn.style.color = 'var(--text-muted)';
    
    title.textContent = '✨ 비밀번호 최초 설정';
    desc.textContent = '관리자가 등록한 이름으로 새 비밀번호를 설정합니다.';
    pwLabel.innerHTML = '새 비밀번호 <span class="required">*</span>';
    submitBtn.textContent = '비밀번호 설정 및 로그인';
    if(hint) hint.style.display = 'block';
  }
}

async function submitAuth(event) {
  event.preventDefault();
  const nameInput = document.getElementById('auth-name');
  const pwInput = document.getElementById('auth-password');
  const btn = document.getElementById('submit-auth-btn');
  
  const name = nameInput.value.trim();
  const pw = pwInput.value;
  
  if (!name || !pw) return;
  
  btn.disabled = true;
  btn.textContent = '확인 중...';
  
  try {
    const { data: emp, error } = await db
      .from('employees')
      .select('*')
      .eq('name', name)
      .maybeSingle();
      
    if (error) throw error;
    
    if (!emp) {
      showToast('등록되지 않은 이름입니다. 관리자에게 문의하세요.', 'error');
      btn.disabled = false;
      btn.textContent = currentAuthMode === 'login' ? '로그인' : '비밀번호 설정 및 로그인';
      return;
    }
    
    const pwHash = await hashPassword(pw);

    if (currentAuthMode === 'signup') {
      if (emp.password_hash) {
        showToast('이미 비밀번호가 설정되어 있습니다. 로그인 탭을 이용하세요.', 'error');
        setAuthMode('login');
      } else {
        const { error: updateError } = await db
          .from('employees')
          .update({ password_hash: pwHash })
          .eq('id', emp.id);
        
        if (updateError) throw updateError;
        
        showToast('비밀번호가 설정되었습니다. 환영합니다!', 'success');
        loginSuccess(emp);
      }
    } else {
      if (!emp.password_hash) {
        showToast('비밀번호가 설정되지 않았습니다. 최초 설정을 진행해 주세요.', 'error');
        setAuthMode('signup');
      } else if (emp.password_hash !== pwHash) {
        showToast('비밀번호가 일치하지 않습니다.', 'error');
      } else {
        showToast(`환영합니다, ${emp.name}님!`, 'success');
        loginSuccess(emp);
      }
    }
  } catch (err) {
    console.error('인증 오류:', err);
    showToast('오류가 발생했습니다.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = currentAuthMode === 'login' ? '로그인' : '비밀번호 설정 및 로그인';
  }
}

function loginSuccess(emp) {
  currentUser = {
    id: emp.id,
    name: emp.name,
    role: emp.role,
    department: emp.department,
    title: emp.title
  };
  // 새로고침 시 로그인이 풀리도록 localStorage 저장 생략
  closeAuthModal();
  updateAuthUI();
  
  document.getElementById('auth-name').value = '';
  document.getElementById('auth-password').value = '';
  
  // 로그인 성공 시 현재 활성화된 탭 새로고침 (권한 버튼 즉시 렌더링)
  reloadActiveTab();
}

function logout() {
  currentUser = null;
  updateAuthUI();
  showToast('로그아웃 되었습니다.', 'success');
  
  // 로그아웃 시 현재 활성화된 탭 새로고침 (권한 버튼 즉시 숨김)
  reloadActiveTab();
  
  // 결재 승인 탭에 있다면 방문자 등록 탭으로 쫓아내기 (사용자 요청에 따라 유지하거나 쫓아내거나 선택할 수 있으나, 위쪽에서 reloadActiveTab을 했으므로 안전함. 기존 쫓아내기 로직 유지)
  const approvalPanel = document.getElementById('tab-approval');
  if (approvalPanel && approvalPanel.classList.contains('active')) {
    switchTab('register');
  }
}


// 현재 활성화된 탭의 데이터를 다시 불러오는 헬퍼 함수
function reloadActiveTab() {
  const activeTabBtn = document.querySelector('.nav-btn.active');
  if (activeTabBtn) {
    const tabId = activeTabBtn.id.replace('tab-', '').replace('-btn', '');
    if (tabId === 'approval') loadPendingApprovals();
    else if (tabId === 'archive') {
      // archive는 필터 상태를 유지하기 위해 버튼 active 상태 확인
      const activeFilterBtn = document.querySelector('#archive-container .btn-primary');
      if(activeFilterBtn) activeFilterBtn.click();
      else loadArchiveApprovals();
    }
    else if (tabId === 'trash') {
      const activeTrashFilterBtn = document.querySelector('.trash-filter-btn.active');
      const filter = activeTrashFilterBtn ? activeTrashFilterBtn.dataset.trashFilter : 'all';
      loadTrash(filter);
    }
    else if (tabId === 'audit') loadAuditLog();
  }
}

// =====================================================================
// 관리대장 출력 및 DB 추출 기능
// =====================================================================
let currentLedgerData = [];

async function loadLedger() {
  const startDate = document.getElementById('ledger-start-date').value;
  const endDate = document.getElementById('ledger-end-date').value;
  const tbody = document.getElementById('ledger-tbody');

  if (!startDate || !endDate) {
    showToast('시작일과 종료일을 모두 선택해 주세요.', 'error');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="9" style="padding:2rem;">데이터를 불러오는 중...</td></tr>';

  try {
    const { data, error } = await db
      .from('visitors')
      .select('*')
      // 승인 또는 반려 처리된 건만 가져옴 (결재 완료된 건)
      .in('approval_status', ['승인', '반려'])
      .is('deleted_at', null)
      .gte('visit_date', startDate)
      .lte('visit_date', endDate)
      .order('visit_date', { ascending: true })
      .order('visit_time', { ascending: true });

    if (error) throw error;
    
    currentLedgerData = data || [];
    renderLedgerTable();
  } catch (err) {
    console.error('관리대장 로드 오류:', err);
    tbody.innerHTML = '<tr><td colspan="9" style="padding:2rem; color:red;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
  }
}

function renderLedgerTable() {
  const tbody = document.getElementById('ledger-tbody');
  tbody.innerHTML = '';

  if (currentLedgerData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:2rem;">해당 기간에 결재 완료된 방문 기록이 없습니다.</td></tr>';
    return;
  }

  currentLedgerData.forEach((record, index) => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #ddd';
    
    const visitDateTime = `${record.visit_date} ${record.visit_time || ''}`.trim();
    const company = record.visitor_company || record.company || '';
    const name = record.visitor_name || record.name || '';
    const purpose = record.visit_purpose || record.purpose || '';
    const guideName = record.guide_name || '';
    
    // 적합/부적합 표시 (인쇄 시 심플한 텍스트로 표시)
    const fitnessText = record.fitness_status === '적합' 
      ? '<span style="color:#000;">적합</span>' 
      : record.fitness_status === '부적합' 
        ? '<span style="color:#000;">부적합</span>' 
        : '';
      
    // 승인/반려 표시 (인쇄 시 심플한 텍스트로 표시)
    const approvalText = record.approval_status === '승인'
      ? '<span style="color:#000;">승인</span>'
      : '<span style="color:#000;">반려</span>';

    tr.innerHTML = `
      <td style="border:1px solid #000; padding:6px 4px;">${index + 1}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${visitDateTime}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${company}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${name}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${purpose}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${guideName}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${fitnessText}</td>
      <td style="border:1px solid #000; padding:6px 4px;">${approvalText}</td>
      <td style="border:1px solid #000; padding:6px 4px;"></td>
    `;
    tbody.appendChild(tr);
  });
}

function exportToCSV() {
  if (currentLedgerData.length === 0) {
    showToast('다운로드할 데이터가 없습니다.', 'error');
    return;
  }

  // BOM (Byte Order Mark) for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  let csvContent = BOM + "No,방문일시,소속,성명,방문 목적,안내자,적합 여부,최종 결재\n";

  currentLedgerData.forEach((record, index) => {
    const visitDateTime = `${record.visit_date} ${record.visit_time || ''}`.trim();
    // CSV 파싱 오류를 막기 위해 쉼표 제거 및 쌍따옴표 처리
    const escapeCsv = (str) => '"' + String(str).replace(/"/g, '""') + '"';
    
    const company = escapeCsv(record.visitor_company || record.company || '');
    const name = escapeCsv(record.visitor_name || record.name || '');
    const purpose = escapeCsv(record.visit_purpose || record.purpose || '');
    const guideName = escapeCsv(record.guide_name || '');
    const fitness = escapeCsv(record.fitness_status || '미선택');
    const approval = escapeCsv(record.approval_status || '');

    const row = [
      index + 1,
      visitDateTime,
      company,
      name,
      purpose,
      guideName,
      fitness,
      approval
    ].join(',');

    csvContent += row + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const startDate = document.getElementById('ledger-start-date').value;
  const endDate = document.getElementById('ledger-end-date').value;
  
  link.setAttribute('href', url);
  link.setAttribute('download', `방문자_출입_관리대장_${startDate}_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 타임라인 이력 로깅 함수 ---
async function logAction(visitorId, action, remarks = null) {
  try {
    const actorName = currentUser ? `${currentUser.name} (${currentUser.role})` : '시스템/알수없음';
    const { error } = await db.from('visitor_logs').insert([{
      visitor_id: visitorId,
      action: action,
      actor_name: actorName,
      remarks: remarks
    }]);
    
    if (error) {
      console.error('이력 저장 Supabase 오류:', error);
    }
  } catch (err) {
    console.error('이력 저장 네트워크/런타임 오류:', err);
  }
}

// --- 휴지통 데이터 로드 함수 ---
async function loadTrash(filter = 'all') {
  const loading = document.getElementById('trash-loading');
  const empty = document.getElementById('trash-empty');
  const list = document.getElementById('trash-list');

  // 필터 버튼 UI 업데이트
  document.querySelectorAll('[data-trash-filter]').forEach(btn => {
    if (btn.dataset.trashFilter === filter) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (!loading || !empty || !list) return;

  loading.style.display = 'flex';
  empty.style.display = 'none';
  list.innerHTML = '';

  try {
    // 7일이 지난 데이터는 조회 시 배제 (나중에 배치로 DB에서 삭제하거나 여기서 안 보이게 함)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let query = db
      .from('visitors')
      .select('*')
      .not('deleted_at', 'is', null)
      .gte('deleted_at', sevenDaysAgo.toISOString())
      .order('deleted_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('approval_status', '대기');
    } else if (filter === 'archive') {
      query = query.neq('approval_status', '대기');
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data.length === 0) {
      empty.style.display = 'flex';
    } else {
      data.forEach(record => {
        const deletedAt = new Date(record.deleted_at).toLocaleString('ko-KR');
        
        let originBadge = '';
        if (record.approval_status === '대기') {
           originBadge = '<span class="tag" style="background:#10B981; color:#fff; border:1px solid #10B981; border-radius:9999px; padding:0.2rem 0.6rem; margin-left:0.5rem; font-size:0.8rem;">대기열에서 삭제됨</span>';
        } else {
           originBadge = '<span class="tag" style="background:#F59E0B; color:#fff; border:1px solid #F59E0B; border-radius:9999px; padding:0.2rem 0.6rem; margin-left:0.5rem; font-size:0.8rem;">보관함에서 삭제됨</span>';
        }
        
        let actionBtns = '';
        if (currentUser && (currentUser.role === '승인자' || currentUser.role === '안내자+승인자' || currentUser.role === 'admin' || currentUser.role === 'superadmin')) {
          actionBtns = `
            <button class="btn btn-secondary btn-sm" onclick="restoreRecord('${record.id}')">♻️ 복구</button>
            <button class="btn btn-danger btn-sm" onclick="hardDeleteRecord('${record.id}')">영구 삭제</button>
          `;
        } else {
          actionBtns = `<span style="font-size:0.85rem; color:var(--text-muted);">* 승인자 권한으로 로그인시 복구/삭제 가능</span>`;
        }

        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-header">
            <h3 class="record-name">${record.visitor_name || '이름 없음'} <span class="tag" style="background:#000000; color:#fff; border:1px solid #000000; border-radius:9999px; padding:0.2rem 0.6rem; font-size:0.8rem;">삭제됨</span>${originBadge}</h3>
            <span class="record-date">${deletedAt} 삭제</span>
          </div>
          <div class="record-info">
            <p><strong>방문일:</strong> ${record.visit_date} ${record.visit_time || ''}</p>
            <p><strong>삭제자:</strong> ${record.deleted_by || '알 수 없음'}</p>
          </div>
          <div class="record-actions" style="margin-top:1rem; display:flex; gap:0.5rem; justify-content:flex-end;">
            ${actionBtns}
          </div>
        `;
        list.appendChild(card);
      });
    }
  } catch (err) {
    console.error('휴지통 로드 오류:', err);
    showToast('휴지통 목록을 불러오지 못했습니다.', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

// --- 휴지통 복구 함수 ---
async function restoreRecord(id) {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== '승인자' && currentUser.role !== '안내자+승인자')) {
    showToast('승인자 권한이 필요합니다.', 'error');
    return;
  }
  
  showCustomConfirm('문서 복구', '이 문서를 휴지통에서 복구하시겠습니까?', async () => {
    try {
      const { error } = await db.from('visitors').update({
        deleted_at: null,
        deleted_by: null
      }).eq('id', id);

      if (error) throw error;
      
      await logAction(id, 'RESTORED', '휴지통에서 복구됨');
      showToast('성공적으로 복구되었습니다.', 'success');
      loadTrash();
    } catch (err) {
      console.error('복구 오류:', err);
      showToast('복구 처리 중 오류가 발생했습니다.', 'error');
    }
  });
}

// --- 휴지통 영구 삭제 함수 ---
async function hardDeleteRecord(id) {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== '승인자' && currentUser.role !== '안내자+승인자')) {
    showToast('승인자 권한이 필요합니다.', 'error');
    return;
  }
  
  showCustomConfirm('영구 삭제', '정말 이 문서를 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.', async () => {
    try {
      const { error } = await db.from('visitors').delete().eq('id', id);
      if (error) throw error;
      
      showToast('영구 삭제되었습니다.', 'success');
      loadTrash();
    } catch (err) {
      console.error('영구 삭제 오류:', err);
      showToast('영구 삭제 처리 중 오류가 발생했습니다.', 'error');
    }
  });
}

// --- Soft Delete (휴지통 보내기) 함수 ---
async function softDeleteRecord(id) {
  // 권한 체크: 승인자(admin, superadmin, 승인자, 안내자+승인자) 권한인지 확인
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== '승인자' && currentUser.role !== '안내자+승인자')) {
    showToast('삭제 권한이 없습니다.', 'error');
    return;
  }

  showCustomConfirm('문서 삭제', '이 문서를 삭제하시겠습니까?\n(휴지통으로 이동하며 7일 후 영구 삭제됩니다)', async () => {
    try {
      const actor = currentUser ? `${currentUser.name} (${currentUser.role})` : '알수없음';
      const { error } = await db.from('visitors').update({
        deleted_at: new Date().toISOString(),
        deleted_by: actor
      }).eq('id', id);

      if (error) throw error;

      await logAction(id, 'DELETED', '휴지통으로 이동됨');
      showToast('문서가 휴지통으로 이동되었습니다.', 'success');
      
      // 현재 열려있는 탭에 따라 목록 리프레시
      loadPendingApprovals();
      loadArchiveApprovals('all');
    } catch (err) {
      console.error('삭제 오류:', err);
      showToast('삭제 처리 중 오류가 발생했습니다.', 'error');
    }
  });
}

// --- 타임라인 이력 로드 및 렌더링 함수 ---
async function renderTimeline(visitorId, containerEl) {
  containerEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">이력 로딩 중...</div>';
  
  try {
    const { data, error } = await db.from('visitor_logs')
      .select('*')
      .eq('visitor_id', visitorId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      containerEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-secondary);">기록된 이력이 없습니다.</div>';
      return;
    }

    let html = '<div class="timeline-container" style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">';
    html += '<h4 style="margin-bottom: 1rem; font-size: 1rem; color: var(--text-primary);">문서 이력 타임라인</h4>';
    html += '<div class="timeline" style="position: relative; padding-left: 1.5rem;">';
    
    // 타임라인 세로선 (가상 요소 스타일링)
    html += '<style>.timeline::before { content: ""; position: absolute; left: 0.45rem; top: 0; bottom: 0; width: 2px; background: var(--border-color); }</style>';

    data.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('ko-KR');
      let icon = '📝';
      let actionText = log.action;
      let color = 'var(--text-secondary)';

      if (log.action === 'CREATED') { icon = '📝'; actionText = '문서 작성'; }
      else if (log.action === 'APPROVED') { icon = '✅'; actionText = '결재 승인'; color = 'var(--success)'; }
      else if (log.action === 'REJECTED') { icon = '❌'; actionText = '결재 반려'; color = 'var(--danger)'; }
      else if (log.action === 'DELETED') { icon = '🗑️'; actionText = '삭제됨(휴지통)'; color = '#4B5563'; }
      else if (log.action === 'RESTORED') { icon = '♻️'; actionText = '복구됨'; color = '#3B82F6'; }
      else if (log.action === 'UPDATED') { icon = '✏️'; actionText = '내용 수정'; }

      html += `
        <div class="timeline-item" style="position: relative; margin-bottom: 1rem;">
          <div class="timeline-icon" style="position: absolute; left: -1.5rem; top: 0; background: var(--bg-container); font-size: 0.9rem;">${icon}</div>
          <div class="timeline-content" style="padding-left: 0.5rem;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.2rem;">${date}</div>
            <div style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">
              <span style="color: ${color};">${actionText}</span> - ${log.actor_name}
            </div>
            ${log.remarks ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem; background: var(--bg-body); padding: 0.5rem; border-radius: 4px;">${log.remarks}</div>` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
    containerEl.innerHTML = html;
  } catch (err) {
    console.error('타임라인 로드 오류:', err);
    containerEl.innerHTML = '<div style="padding: 1rem; color: var(--danger);">이력을 불러오지 못했습니다.</div>';
  }
}

// --- 전체 이력 관리 데이터 로드 함수 ---
async function loadAuditLog() {
  const loading = document.getElementById('audit-loading');
  const empty = document.getElementById('audit-empty');
  const list = document.getElementById('audit-list');
  const startDateFilter = document.getElementById('audit-start-date');
  const endDateFilter = document.getElementById('audit-end-date');

  if (!loading || !empty || !list) return;

  loading.style.display = 'block';
  empty.style.display = 'none';
  list.innerHTML = '';
  document.getElementById('audit-table').parentElement.style.display = 'none';

  try {
    let query = db
      .from('visitor_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // 날짜 필터 적용
    if (startDateFilter && startDateFilter.value) {
      const startOfDay = new Date(startDateFilter.value + 'T00:00:00').toISOString();
      query = query.gte('created_at', startOfDay);
    }
    if (endDateFilter && endDateFilter.value) {
      const endOfDay = new Date(endDateFilter.value + 'T23:59:59').toISOString();
      query = query.lte('created_at', endOfDay);
    }

    const { data: logsData, error } = await query;

    if (error) throw error;

    if (logsData.length === 0) {
      empty.style.display = 'flex';
    } else {
      document.getElementById('audit-table').parentElement.style.display = 'block';
      
      // 방문자 기본 정보 매핑을 위해 visitor_id 추출 및 별도 조회 (Join 오류 방지)
      const visitorIds = [...new Set(logsData.map(log => log.visitor_id))].filter(id => id);
      
      let visitorsMap = {};
      if (visitorIds.length > 0) {
        const { data: vData } = await db.from('visitors').select('id, visitor_name, visitor_company').in('id', visitorIds);
        if (vData) {
          vData.forEach(v => { visitorsMap[v.id] = v; });
        }
      }

      logsData.forEach(log => {
        const date = new Date(log.created_at).toLocaleString('ko-KR');
        
        let actionBadge = '';
        const badgeBaseStyle = 'color:#fff; border-radius:9999px; padding:0.2rem 0.6rem; font-size:0.75rem; font-weight:bold; display:inline-block; border:1px solid rgba(0,0,0,0.1);';
        
        if (log.action === 'CREATED') actionBadge = `<span class="tag" style="background:#4B5563; ${badgeBaseStyle}">등록</span>`;
        else if (log.action === 'APPROVED') actionBadge = `<span class="tag" style="background:#047857; ${badgeBaseStyle}">승인</span>`;
        else if (log.action === 'REJECTED') actionBadge = `<span class="tag" style="background:#B91C1C; ${badgeBaseStyle}">반려</span>`;
        else if (log.action === 'DELETED') actionBadge = `<span class="tag" style="background:#E14B4B; ${badgeBaseStyle}">삭제됨</span>`; // 붉은색
        else if (log.action === 'RESTORED') actionBadge = `<span class="tag" style="background:#14A870; ${badgeBaseStyle}">복구됨</span>`; // 초록색
        else if (log.action === 'UPDATED') actionBadge = `<span class="tag" style="background:#6366F1; ${badgeBaseStyle}">수정됨</span>`;
        else actionBadge = `<span class="tag" style="background:#9DA5AF; ${badgeBaseStyle}">${log.action}</span>`;

        let targetName = '알 수 없음';
        const vInfo = visitorsMap[log.visitor_id];
        if (vInfo) {
          targetName = `${vInfo.visitor_name || '이름 없음'} <span style="color:var(--text-muted); font-size:0.85rem;">(${vInfo.visitor_company || '소속 없음'})</span>`;
        } else {
           // 방문자가 영구 삭제된 경우
           targetName = '<span style="color:var(--danger); font-size:0.85rem;">[영구 삭제된 방문자]</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-size:0.85rem; color:var(--text-secondary);">${date}</td>
          <td>${actionBadge}</td>
          <td style="font-weight:500;">${targetName}</td>
          <td>${log.actor_name}</td>
          <td style="font-size:0.9rem; color:var(--text-secondary);">${log.remarks || ''}</td>
        `;
        list.appendChild(tr);
      });
    }
  } catch (err) {
    console.error('이력 관리 로드 오류:', err);
    showToast('이력 정보를 불러오지 못했습니다.', 'error');
  } finally {
    loading.style.display = 'none';
  }
}

// --- 커스텀 Confirm 기능 ---
let customConfirmCallback = null;

function showCustomConfirm(title, message, callback) {
  const modal = document.getElementById('custom-confirm-modal');
  document.getElementById('custom-confirm-title').textContent = title;
  document.getElementById('custom-confirm-message').textContent = message;
  
  customConfirmCallback = callback;
  
  const confirmBtn = document.getElementById('custom-confirm-btn');
  confirmBtn.onclick = () => {
    if (customConfirmCallback) customConfirmCallback();
    closeCustomConfirm();
  };
  
  if (modal) modal.style.display = 'flex';
}

function closeCustomConfirm() {
  const modal = document.getElementById('custom-confirm-modal');
  if (modal) modal.style.display = 'none';
  customConfirmCallback = null;
}
