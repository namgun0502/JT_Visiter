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
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

  // 초기 탭 데이터를 불러옵니다
  if (document.getElementById('tab-approval').classList.contains('active')) {
    loadPendingApprovals();
  }
});

// =====================================================================
// 탭 전환 기능
// =====================================================================
function switchTab(tabId) {
  // 탭 전환 전 권한 체크 (결재 승인 탭)
  if (tabId === 'approval') {
    if (!currentUser) {
      showToast('결재 승인 탭을 이용하려면 로그인이 필요합니다.', 'error');
      openAuthModal('login');
      return; // 탭 전환 취소
    }
    if (currentUser.role === '안내자') {
      showToast('승인자 권한이 없습니다.', 'error');
      return; // 탭 전환 취소
    }
  }

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
  if (tabId === 'admin') {
    loadAdminEmployees();
  }

  // 페이지 제목 변경
  const titles = { register: '방문자 등록', approval: '결재 승인', admin: '관리자' };
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

  // 창 크기가 바뀔 때 캔버스도 다시 조정합니다
  window.addEventListener('resize', () => {
    if (visitorCanvas) resizeCanvas(visitorCanvas);
    if (guideCanvas) resizeCanvas(guideCanvas);
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
  const guideEl    = document.getElementById('s4-guide');
  const approverEl = document.getElementById('s4-approver');

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
  formData.fitness_status  = '대기';

  // 저장 버튼을 비활성화 (중복 클릭 방지)
  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>저장 중...</span>';

  try {
    // Supabase visitors 테이블에 데이터를 삽입합니다
    const { error } = await db.from('visitors').insert([formData]);

    if (error) throw error;

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
  const guides    = employees.filter(e => !e.role || e.role === '안내자' || e.role === '안내자+승인자');
  const approvers = employees.filter(e => e.role === '승인자' || e.role === '안내자+승인자');

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
      .order('created_at', { ascending: false });

    if (error) throw error;

    badge.textContent = data.length.toString();

    if (data.length === 0) {
      empty.style.display = 'flex';
    } else {
      data.forEach(record => {
        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
          <div class="record-header">
            <h3 class="record-name">${record.visitor_name} <span class="tag tag-pending">승인 대기</span></h3>
            <span class="record-date">${new Date(record.visit_date).toLocaleString('ko-KR')}</span>
          </div>
          <div class="record-body">
            <p><strong>회사:</strong> ${record.company || 'N/A'} <strong>목적:</strong> ${record.purpose}</p>
            <p><strong>안내자:</strong> ${record.guide_name}</p>
          </div>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="showApprovalDetail('${record.id}')">상세 보기 및 결재</button>
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

async function showApprovalDetail(id) {
  try {
    const { data, error } = await db
      .from('visitors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    currentApprovalRecordId = id;
    
    const body = document.getElementById('approval-modal-body');
    body.innerHTML = `
      <div style="display: grid; gap: 1rem;">
        <div style="background: var(--bg); padding: 1rem; border-radius: var(--radius-md);">
          <h4>방문자 정보</h4>
          <p><strong>이름:</strong> ${data.visitor_name} (${data.company || '소속 없음'})</p>
          <p><strong>방문 일시:</strong> ${new Date(data.visit_date).toLocaleString('ko-KR')}</p>
          <p><strong>방문 목적:</strong> ${data.purpose}</p>
        </div>
        
        <div style="background: var(--bg); padding: 1rem; border-radius: var(--radius-md);">
          <h4>건강 상태 점검 (모두 '예'여야 함)</h4>
          <p>1. 최근 14일 이내 해외 방문: ${data.health_q1 ? '예' : '아니오'}</p>
          <p>2. 발열 또는 호흡기 증상: ${data.health_q2 ? '예' : '아니오'}</p>
          <p>3. 확진자 접촉 이력: ${data.health_q3 ? '예' : '아니오'}</p>
        </div>
        
        <div style="background: var(--bg); padding: 1rem; border-radius: var(--radius-md);">
          <h4>안내자 의견</h4>
          <p><strong>안내자:</strong> ${data.guide_name}</p>
          <p><strong>비고:</strong> ${data.remarks || '없음'}</p>
          ${data.guide_signature ? `<img src="${data.guide_signature}" alt="안내자 서명" style="max-height: 80px; background: white; margin-top: 0.5rem;">` : ''}
        </div>
      </div>
    `;

    document.getElementById('approval-modal').style.display = 'flex';
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

  const confirmMsg = decision === '승인' 
    ? '이 방문자를 "적합(승인)" 처리하시겠습니까?'
    : '이 방문자를 "부적합(반려)" 처리하시겠습니까?';

  if (!confirm(confirmMsg)) return;

  try {
    const { error } = await db
      .from('visitors')
      .update({
        approval_status: decision,
        fitness_status: decision === '승인' ? '적합' : '부적합'
      })
      .eq('id', currentApprovalRecordId);

    if (error) throw error;

    showToast(`방문자가 성공적으로 ${decision} 처리되었습니다.`, 'success');
    closeApprovalModal();
    loadPendingApprovals(); // 리스트 새로고침
  } catch (err) {
    console.error('결재 처리 오류:', err);
    showToast('결재 처리 중 오류가 발생했습니다.', 'error');
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

// 관리자 버튼 클릭 시 비밀번호 모달 표시
function checkAdminPassword() {
  const modal = document.getElementById('admin-password-modal');
  const input = document.getElementById('admin-password-input');
  if (modal) {
    modal.style.display = 'flex';
    if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
  }
}

// 비밀번호 확인 모달 닫기
function closeAdminPasswordModal() {
  const modal = document.getElementById('admin-password-modal');
  if (modal) modal.style.display = 'none';
}

// 비밀번호 제출 처리 (Supabase에서 해시값 비교)
async function submitAdminPassword() {
  const input = document.getElementById('admin-password-input');
  const confirmBtn = document.querySelector('#admin-password-modal .btn-primary');
  if (!input) return;

  const pw = input.value;
  if (!pw) { showToast('비밀번호를 입력해 주세요.', 'error'); return; }

  if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '확인 중...'; }

  try {
    const inputHash = await hashPassword(pw);
    const storedHash = await getAdminPasswordHash();

    // DB에 저장된 값이 'init'이거나 없으면 초기 상태 → 기본값 'admin1234'와 비교
    let isCorrect = false;
    if (!storedHash || storedHash === 'init') {
      const defaultHash = await hashPassword('admin1234');
      isCorrect = (inputHash === defaultHash);
    } else {
      isCorrect = (inputHash === storedHash);
    }

    if (isCorrect) {
      closeAdminPasswordModal();
      switchTab('admin');
      document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      const adminBtn = document.getElementById('tab-admin-btn');
      if (adminBtn) { adminBtn.classList.add('active'); adminBtn.setAttribute('aria-selected', 'true'); }
      showToast('관리자 페이지에 접속했습니다.', 'success');
    } else {
      showToast('비밀번호가 올바르지 않습니다.', 'error');
      input.value = '';
      input.focus();
    }
  } catch (err) {
    console.error('비밀번호 확인 오류:', err);
    showToast('오류가 발생했습니다. 다시 시도해 주세요.', 'error');
  } finally {
    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '🔓 확인'; }
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
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  closeAuthModal();
  updateAuthUI();
  
  document.getElementById('auth-name').value = '';
  document.getElementById('auth-password').value = '';
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthUI();
  showToast('로그아웃 되었습니다.', 'success');
  
  // 결재 승인 탭에 있다면 방문자 등록 탭으로 쫓아내기
  const approvalPanel = document.getElementById('tab-approval');
  if (approvalPanel && approvalPanel.classList.contains('active')) {
    switchTab('register');
  }
}
