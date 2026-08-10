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

  // Supabase에서 방문 기록과 직원 목록을 불러옵니다
  loadRecords();
  loadEmployees();
});

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
// 6. 탭 전환 (방문자 등록 / 방문 기록 / 직원 관리)
// =====================================================================
function switchTab(tabName) {
  // 모든 탭 패널과 버튼에서 active 클래스를 제거합니다
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  // 선택된 탭 패널과 버튼에 active 클래스를 추가합니다
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  const btn = document.getElementById(`tab-${tabName}-btn`);
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
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
function selectFitness(btn) {
  document.querySelectorAll('.fitness-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  formData.fitness_status = btn.dataset.value;
}

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
  document.querySelectorAll('.fitness-btn').forEach(b => b.classList.remove('active'));
  const fitOk = document.querySelector('.fitness-ok');
  if (fitOk) fitOk.classList.add('active'); // '적합'을 기본값으로
  formData.fitness_status = '적합';
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
  if (!formData.fitness_status) formData.fitness_status = '적합';

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
    loadRecords(); // 방문 기록 새로고침
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
// 16. 방문 기록 불러오기
// =====================================================================
async function loadRecords() {
  const loadingEl = document.getElementById('records-loading');
  const emptyEl   = document.getElementById('records-empty');
  const listEl    = document.getElementById('records-list');

  // 로딩 상태 표시
  loadingEl.style.display = 'flex';
  emptyEl.style.display   = 'none';
  listEl.innerHTML        = '';

  try {
    // Supabase에서 모든 방문 기록을 최신순으로 가져옵니다
    const { data, error } = await db
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allRecords = data || [];
    renderRecords(allRecords);
  } catch (err) {
    console.error('기록 불러오기 오류:', err);
    showToast('기록을 불러오지 못했습니다.', 'error');
    loadingEl.style.display = 'none';
  }
}

// 방문 기록을 화면에 그리는 함수
function renderRecords(records) {
  const loadingEl = document.getElementById('records-loading');
  const emptyEl   = document.getElementById('records-empty');
  const listEl    = document.getElementById('records-list');
  const badgeEl   = document.getElementById('records-badge');

  loadingEl.style.display = 'none';

  if (records.length === 0) {
    emptyEl.style.display = 'flex';
    listEl.innerHTML      = '';
    if (badgeEl) badgeEl.textContent = '0';
    return;
  }

  emptyEl.style.display = 'none';
  if (badgeEl) badgeEl.textContent = allRecords.length;

  // 각 기록을 카드 형태로 HTML 문자열로 만들어 한번에 삽입합니다
  listEl.innerHTML = records.map(r => {
    // 날짜와 시간 표시
    const dateStr = r.visit_date
      ? new Date(r.visit_date + 'T00:00:00').toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' })
      : '';
    const timeStr = r.visit_time ? r.visit_time.substring(0, 5) : '';

    // 적합/부적합 태그
    const fitnessTag = r.fitness_status === '부적합'
      ? `<span class="record-tag tag-fitness-ng">❌ ${r.fitness_status}</span>`
      : `<span class="record-tag tag-fitness-ok">✅ ${r.fitness_status || '적합'}</span>`;

    // 결재상태 태그
    const approvalClass = r.approval_status === '승인' ? 'tag-fitness-ok'
                        : r.approval_status === '반려' ? 'tag-fitness-ng'
                        : 'tag-pending';
    const approvalTag = `<span class="record-tag ${approvalClass}">📋 ${r.approval_status || '대기'}</span>`;

    return `
      <div class="record-card" id="record-${r.id}">
        <div class="record-info">
          <div class="record-name">${escapeHtml(r.visitor_name)}</div>
          <div class="record-tags">
            ${r.visitor_company ? `<span class="record-tag tag-company">🏢 ${escapeHtml(r.visitor_company)}</span>` : ''}
            <span class="record-tag tag-purpose">🎯 ${escapeHtml(r.visit_purpose || '')}</span>
            ${r.guide_name ? `<span class="record-tag tag-employee">👤 ${escapeHtml(r.guide_name)}</span>` : ''}
            ${fitnessTag}
            ${approvalTag}
          </div>
          <div class="record-date">📅 ${dateStr} ${timeStr}</div>
          ${r.remarks ? `<div class="record-phone">📝 ${escapeHtml(r.remarks)}</div>` : ''}
        </div>
        <div class="record-actions">
          <button
            class="btn btn-icon-only"
            title="삭제"
            onclick="confirmDelete(${r.id}, 'visitor', '${escapeHtml(r.visitor_name)} 방문 기록')"
          >🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// =====================================================================
// 17. 방문 기록 검색
// =====================================================================
function handleSearch() {
  const query = document.getElementById('search-input').value.trim().toLowerCase();
  const clearBtn = document.getElementById('search-clear-btn');

  // 검색어가 있으면 X 버튼 표시
  clearBtn.style.display = query ? 'block' : 'none';

  if (!query) {
    renderRecords(allRecords);
    return;
  }

  // 이름 또는 회사명 또는 방문목적으로 필터링
  const filtered = allRecords.filter(r =>
    (r.visitor_name    || '').toLowerCase().includes(query) ||
    (r.visitor_company || '').toLowerCase().includes(query) ||
    (r.visit_purpose   || '').toLowerCase().includes(query) ||
    (r.guide_name      || '').toLowerCase().includes(query)
  );
  renderRecords(filtered);
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear-btn').style.display = 'none';
  renderRecords(allRecords);
}

// =====================================================================
// 18. 직원 목록 불러오기
// =====================================================================
async function loadEmployees() {
  const loadingEl = document.getElementById('employees-loading');
  const emptyEl   = document.getElementById('employees-empty');
  const listEl    = document.getElementById('employees-list');

  loadingEl.style.display = 'flex';
  emptyEl.style.display   = 'none';
  listEl.innerHTML        = '';

  try {
    // Supabase employees 테이블에서 이름 오름차순으로 가져옵니다
    const { data, error } = await db
      .from('employees')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    const employees = data || [];
    renderEmployeeList(employees);

    // Step 4의 드롭다운도 업데이트합니다
    updateEmployeeDropdowns(employees);
  } catch (err) {
    console.error('직원 불러오기 오류:', err);
    loadingEl.style.display = 'none';
  }
}

// 직원 카드를 화면에 그리는 함수
function renderEmployeeList(employees) {
  const loadingEl = document.getElementById('employees-loading');
  const emptyEl   = document.getElementById('employees-empty');
  const listEl    = document.getElementById('employees-list');

  loadingEl.style.display = 'none';

  if (employees.length === 0) {
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = employees.map(e => `
    <div class="employee-card" id="emp-${e.id}">
      <div class="employee-info">
        <div class="employee-name">👤 ${escapeHtml(e.name)}</div>
        ${e.department ? `<div class="employee-dept">${escapeHtml(e.department)}</div>` : ''}
      </div>
      <button
        class="btn btn-icon-only"
        title="삭제"
        onclick="confirmDelete(${e.id}, 'employee', '${escapeHtml(e.name)}')"
      >🗑️</button>
    </div>
  `).join('');
}

// 직원 드롭다운(안내자, 승인자)을 직원 목록으로 채우는 함수
function updateEmployeeDropdowns(employees) {
  const guideSelect    = document.getElementById('s4-guide');
  const approverSelect = document.getElementById('s4-approver');

  [guideSelect, approverSelect].forEach(select => {
    if (!select) return;
    const currentVal = select.value;
    // 기존 옵션 초기화 (첫 번째 '선택하세요' 옵션 유지)
    while (select.options.length > 1) select.remove(1);
    // 직원 목록을 옵션으로 추가
    employees.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.name;
      opt.textContent = e.department ? `${e.name} (${e.department})` : e.name;
      select.appendChild(opt);
    });
    // 이전에 선택된 값이 있으면 유지
    if (currentVal) select.value = currentVal;
  });
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
// 19. 직원 추가
// =====================================================================
async function handleAddEmployee(event) {
  event.preventDefault(); // 폼이 새로고침되는 것을 막습니다

  const nameInput = document.getElementById('e-name');
  const deptInput = document.getElementById('e-dept');
  const addBtn    = document.getElementById('add-employee-btn');

  const name = nameInput.value.trim();
  const dept = deptInput.value.trim();

  if (!name) {
    showToast('직원 이름을 입력해 주세요.', 'error'); return;
  }

  addBtn.disabled = true;
  addBtn.textContent = '추가 중...';

  try {
    const { error } = await db
      .from('employees')
      .insert([{ name, department: dept }]);

    if (error) throw error;

    showToast(`✅ ${name} 직원이 추가되었습니다!`, 'success');
    nameInput.value = '';
    deptInput.value = '';
    loadEmployees(); // 직원 목록 새로고침
  } catch (err) {
    console.error('직원 추가 오류:', err);
    showToast('직원 추가 중 오류가 발생했습니다.', 'error');
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = '+ 직원 추가';
  }
}

// =====================================================================
// 20. 삭제 확인 모달
// =====================================================================
function confirmDelete(id, type, label) {
  pendingDeleteId   = id;
  pendingDeleteType = type;

  document.getElementById('modal-desc').textContent =
    `"${label}"을(를) 삭제하면 복구할 수 없습니다.`;

  const overlay = document.getElementById('modal-overlay');
  overlay.style.display = 'flex';

  // 확인 버튼 클릭 시 실제 삭제 실행
  document.getElementById('modal-confirm-btn').onclick = executeDelete;
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  pendingDeleteId   = null;
  pendingDeleteType = null;
}

async function executeDelete() {
  if (!pendingDeleteId || !pendingDeleteType) return;

  const tableName = pendingDeleteType === 'visitor' ? 'visitors' : 'employees';
  const cardId    = pendingDeleteType === 'visitor' ? `record-${pendingDeleteId}` : `emp-${pendingDeleteId}`;

  closeModal();

  try {
    const { error } = await db
      .from(tableName)
      .delete()
      .eq('id', pendingDeleteId);

    if (error) throw error;

    // 카드 요소를 화면에서 페이드 아웃 후 제거
    const cardEl = document.getElementById(cardId);
    if (cardEl) {
      cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
      cardEl.style.opacity    = '0';
      cardEl.style.transform  = 'translateX(-20px)';
      setTimeout(() => cardEl.remove(), 300);
    }

    showToast('삭제되었습니다.', 'success');

    // 전체 기록 목록도 업데이트
    if (pendingDeleteType === 'visitor') {
      allRecords = allRecords.filter(r => r.id !== pendingDeleteId);
      const badgeEl = document.getElementById('records-badge');
      if (badgeEl) badgeEl.textContent = allRecords.length;
    }
  } catch (err) {
    console.error('삭제 오류:', err);
    showToast('삭제 중 오류가 발생했습니다.', 'error');
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
