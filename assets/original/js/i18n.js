/* ==========================================================================
   i18n.js — 中英雙語系統
   ==========================================================================
   用法:
   - HTML 元素加 data-i18n="key" → 自動翻譯文字內容
   - HTML 元素加 data-i18n-ph="key" → 翻譯 placeholder
   - JS 動態文字用 t('key')
   - 切換語言: setLang('en') / setLang('zh')
   ========================================================================== */

const I18N = {
  zh: {
    // 導覽
    'nav.analyze': '分析', 'nav.history': '我的紀錄', 'nav.admin': '管理後台',
    'nav.settings': '設定', 'nav.logout': '登出',
    'confirm.logout_title': '確認登出', 'confirm.logout_message': '確定要登出目前這個裝置嗎？',
    'confirm.logout_action': '登出', 'confirm.logout_all_title': '登出所有裝置',
    'confirm.logout_all_message': '所有電腦、手機與目前這個裝置都會立即登出，需要重新輸入帳號密碼。',
    'confirm.logout_all_action': '全部登出',
    'brand.name': 'AI 評分系統',
    'footer.institution': '國立臺灣海洋大學',
    'footer.project': 'AI 增強影像評分系統於手術訓練之應用',
    'page.base': 'AI 評分系統 · IDA Lab', 'page.login': '登入 · AI 評分系統',
    'page.register': '註冊 · AI 評分系統', 'page.forgot': '忘記密碼 · AI 評分系統',
    'page.reset': '重設密碼 · AI 評分系統', 'page.analyze': '影像分析 · AI 評分系統',
    'page.history': '我的紀錄 · AI 評分系統', 'page.admin': '管理後台 · AI 評分系統',
    'page.settings': '設定 · AI 評分系統', 'page.student': '學生紀錄 · AI 評分系統',
    'page.error': '錯誤 · AI 評分系統',
    'role.admin': '管理者', 'role.student': '學生',
    // 登入
    'login.subtitle': 'NTOU · IDA LAB',
    'login.account': '帳號', 'login.password': '密碼', 'login.remember': '記住我',
    'login.btn': '登入', 'login.no_account': '還沒有帳號？', 'login.register_now': '立即註冊',
    'login.ph_account': '輸入您的帳號', 'login.ph_password': '輸入您的密碼',
    // 註冊
    'register.title': '建立帳號', 'register.subtitle': '註冊學生帳號以使用 AI 評分系統',
    'register.invite': '邀請碼', 'register.invite_ph': '輸入課程提供的邀請碼',
    'register.hint_account': '(至少 3 字元)', 'register.hint_email': '(必填，用於密碼重設)',
    'register.hint_password': '(至少 8 字元)', 'register.confirm': '確認密碼',
    'register.btn': '註冊', 'register.has_account': '已經有帳號了？', 'register.go_login': '前往登入',
    'register.ph_account': '設定您的帳號', 'register.ph_password': '設定密碼', 'register.ph_password2': '再次輸入密碼',
    // 分析頁
    'index.title1': 'AI', 'index.accent': '評分系統',
    'index.desc': '上傳柑橘剝皮模擬訓練影像，系統將進行圖像處理、AI 輔助評估與 0–100 分評分。檔名含分數（如 75_001.jpg）時會進行模型驗證。',
    'index.drop_title': '拖曳影像至此，或點擊上傳', 'index.drop_sub': '支援多張同時上傳 · JPG / PNG / HEIC',
    'index.choose': '選擇影像', 'index.choose_gallery': '從相簿選擇',
    'summary.title': '本次分析總覽', 'summary.avg': '平均 AI 評分', 'summary.mae': '平均誤差 (MAE)',
    'summary.hits': '分級命中', 'summary.analyzed': '已分析',
    'summary.best': '本次最高分', 'summary.vs_prev': '較上次', 'summary.first_time': '第一次',
    'index.desc_student': '上傳柑橘剝皮模擬訓練影像，系統會進行 AI 輔助評估，並顯示完整性、清潔度與評分結果。',
    'index.camera': '拍照上傳',
    'rubric.title': '評分標準', 'rubric.note': '系統依破皮與白膜殘留的圖像處理結果計算完整性、清潔度與 AI 評分，用於 AI 輔助評估。',
    'settings.force_pw_title': '請先設定你自己的密碼',
    'settings.force_pw_desc': '你的帳號由管理者建立、使用預設密碼。為了帳號安全，請在下方「修改密碼」設定新密碼後，才能使用其他功能。',
    // 我的紀錄
    'history.title': '我的', 'history.accent': '評分紀錄',
    'history.desc': '您過去上傳分析的所有影像與 AI 評分結果。點擊欄位標題可切換排序，點任一列看詳情。',
    'history.total': '總分析次數', 'history.avg': '平均 AI 評分', 'history.best': '最高分', 'history.recent': '最近一次',
    'history.table_title': '分析歷史', 'history.sort_hint': '點欄位標題排序', 'history.trend_title': '分析趨勢',
    // 表頭
    'th.time': '時間', 'th.filename': '檔名', 'th.mode': '模式', 'th.ai': 'AI 評分', 'th.ai_short': 'AI',
    'th.doctor': '主持人評估', 'th.doctor_short': '主持人', 'th.error': '誤差',
    'th.damage': '破皮比例', 'th.damage_short': '破皮', 'th.white': '白膜比例', 'th.white_short': '白膜',
    'th.role': '角色', 'th.count': '分析數', 'th.register_time': '註冊時間', 'th.student': '學生', 'th.actions': '操作',
    // 模式
    'mode.verify': '模型驗證', 'mode.predict': 'AI 輔助評估',
    'mode.verify_full': '模型驗證', 'mode.predict_full': 'AI 輔助評估',
    // 管理後台
    'admin.title': '管理', 'admin.accent': '後台',
    'admin.desc': '檢視所有學生帳號與評分紀錄。點學生列可看其個人紀錄；點欄位標題可排序。',
    'admin.export': '匯出全部紀錄 CSV', 'admin.students': '使用者帳號', 'admin.records': '所有評分紀錄',
    'admin.import': '批次匯入帳號', 'admin.scroll_hint': '滑到底自動載入',
    'stats.students': '學生人數', 'stats.analyses': '總分析次數', 'stats.verify': '驗證模式次數',
    'stats.hits': '分類命中', 'stats.mae': '平均誤差',
    'admin.search_ph': '搜尋檔名...', 'admin.min_score': '最低分', 'admin.max_score': '最高分',
    'admin.all_modes': '全部模式', 'admin.filter': '篩選', 'admin.clear': '清除',
    'admin.delete_record': '刪除', 'admin.confirm_del_record': '確定刪除這筆紀錄？',
    'admin.confirm_del_user': '確定刪除此帳號及其所有紀錄？此動作無法復原。',
    'admin.make_admin': '設為管理者', 'admin.make_student': '設為學生', 'admin.del_user': '刪除帳號',
    'admin.people': '人',
    // 設定
    'settings.title': '設定', 'settings.appearance': '外觀', 'settings.theme': '主題模式',
    'settings.light': '亮色', 'settings.dark': '暗色', 'settings.language': '語言',
    'settings.account': '帳號設定', 'settings.profile': '個人資料', 'settings.email': '密碼重設 Email',
    'settings.email_hint': '忘記密碼時，重設連結會寄到這個信箱（Gmail 或其他有效 Email 皆可）。',
    'settings.email_password': '輸入目前密碼以變更 Email',
    'settings.save_profile': '儲存資料', 'settings.security': '安全', 'settings.change_pw': '修改密碼',
    'settings.old_pw': '目前密碼', 'settings.new_pw': '新密碼', 'settings.new_pw2': '確認新密碼',
    'settings.change_pw_btn': '更新密碼', 'settings.prefs': '偏好',
    'settings.pw_hint': '（至少 8 字元）',
    'settings.last_login': '上次登入',
    'settings.last_login_hint': '若這個時間或位置不是你本人操作，請立即修改密碼並登出所有裝置。',
    'settings.logout_all': '登出所有裝置',
    'settings.logout_all_hint': '立即登出所有電腦、手機與目前這個裝置',
    'settings.logout_all_btn': '登出所有裝置',
    // 匯入彈窗
    'import.title': '批次匯入帳號', 'import.desc': '上傳 CSV 檔，每列格式：帳號,密碼,Email,角色 (Email 和角色可省略)',
    'import.format': '範例：student01,pass123,s1@mail.com,student', 'import.choose': '選擇 CSV 檔',
    'import.btn': '開始匯入', 'import.default_pw': '未填密碼者預設為 citrus123',
    'import.default_pw_title': '未填密碼者一律預設為', 'import.default_pw_hint': '— 請通知這些學生首次登入後立即到「設定」修改密碼',
    // 詳情彈窗
    'detail.title': '偵測詳情', 'detail.analyzing': '正在載入過去分析…',
    'detail.summary': '綜合評定', 'detail.doctor_score': '主持人評估', 'detail.abs_error': '絕對誤差',
    'detail.new_case': 'AI 輔助評估', 'detail.damage_feat': '破皮特徵', 'detail.white_feat': '白膜特徵',
    'detail.optics_feat': '色彩特徵', 'detail.damage_ratio': '破損佔比', 'detail.damage_count': '破損區塊數',
    'detail.max_block': '最大單塊佔比', 'detail.confidence': '模型信心度', 'detail.white_ratio': '白膜佔比',
    'detail.white_count': '白膜區塊數', 'detail.top3': '前三大佔比', 'detail.hsv_s': 'HSV 飽和度',
    'detail.hsv_v': 'HSV 明亮度', 'detail.lab_b': 'LAB 黃藍值', 'detail.points': '分',
    'detail.orig': '原始影像', 'detail.roi': '橘皮區域', 'detail.white_det': '白膜偵測', 'detail.damage_det': '破皮偵測',
    // 等第
    'grade.excellent': '優異 Excellent', 'grade.good': '良好 Good', 'grade.fair': '待改進 Fair', 'grade.poor': '不及格 Poor',
    // 共用
    'common.cancel': '取消', 'common.confirm': '確定', 'common.save': '儲存', 'common.loading': '載入中...',
    'common.empty': '尚無紀錄', 'common.back': '‹ 返回管理後台', 'common.actions': '操作',
    'progress.analyzing': '分析中...', 'progress.uploading': '上傳並分析中...',
  },
  en: {
    'nav.analyze': 'Analyze', 'nav.history': 'My Records', 'nav.admin': 'Admin',
    'nav.settings': 'Settings', 'nav.logout': 'Log out',
    'confirm.logout_title': 'Sign out?', 'confirm.logout_message': 'Sign out on this device?',
    'confirm.logout_action': 'Sign out', 'confirm.logout_all_title': 'Sign out all devices?',
    'confirm.logout_all_message': 'Every computer and phone, including this device, will be signed out immediately. You will need to enter your credentials again.',
    'confirm.logout_all_action': 'Sign out all',
    'brand.name': 'AI Scoring System',
    'footer.institution': 'National Taiwan Ocean University',
    'footer.project': 'AI-Enhanced Image Scoring for Surgical Training',
    'page.base': 'AI Scoring System · IDA Lab', 'page.login': 'Sign In · AI Scoring System',
    'page.register': 'Register · AI Scoring System', 'page.forgot': 'Forgot Password · AI Scoring System',
    'page.reset': 'Reset Password · AI Scoring System', 'page.analyze': 'Image Analysis · AI Scoring System',
    'page.history': 'My Records · AI Scoring System', 'page.admin': 'Admin · AI Scoring System',
    'page.settings': 'Settings · AI Scoring System', 'page.student': 'Student Records · AI Scoring System',
    'page.error': 'Error · AI Scoring System',
    'role.admin': 'Admin', 'role.student': 'Student',
    'login.subtitle': 'NTOU · IDA LAB',
    'login.account': 'Username', 'login.password': 'Password', 'login.remember': 'Remember me',
    'login.btn': 'Sign In', 'login.no_account': "Don't have an account? ", 'login.register_now': 'Register now',
    'login.ph_account': 'Enter your username', 'login.ph_password': 'Enter your password',
    'register.title': 'Create Account', 'register.subtitle': 'Register a student account to use the AI Scoring System',
    'register.invite': 'Invitation Code', 'register.invite_ph': 'Enter the course invitation code',
    'register.hint_account': '(min 3 chars)', 'register.hint_email': '(required for password recovery)',
    'register.hint_password': '(min 8 chars)', 'register.confirm': 'Confirm Password',
    'register.btn': 'Register', 'register.has_account': 'Already have an account? ', 'register.go_login': 'Sign in',
    'register.ph_account': 'Choose a username', 'register.ph_password': 'Set a password', 'register.ph_password2': 'Re-enter password',
    'index.title1': 'AI', 'index.accent': 'Scoring System',
    'index.desc': 'Upload citrus peel simulation training images for image processing, AI-assisted evaluation, and 0–100 scoring. Filenames that include a score, such as 75_001.jpg, are used for model validation.',
    'index.drop_title': 'Drag images here, or click to upload', 'index.drop_sub': 'Multiple images supported · JPG / PNG / HEIC',
    'index.choose': 'Choose Images', 'index.choose_gallery': 'Choose from Gallery',
    'summary.title': 'Batch Summary', 'summary.avg': 'Avg AI Score', 'summary.mae': 'Mean Abs Error',
    'summary.hits': 'Grade Matches', 'summary.analyzed': 'Analyzed',
    'summary.best': 'Best This Time', 'summary.vs_prev': 'vs Last', 'summary.first_time': 'First',
    'index.desc_student': 'Upload citrus peel simulation training images for AI-assisted evaluation of integrity, cleanliness, and scoring results.',
    'index.camera': 'Take Photo',
    'rubric.title': 'Scoring Standards', 'rubric.note': 'The system uses image-processing results for tearing and membrane residue to calculate integrity, cleanliness, and the AI score for AI-assisted evaluation.',
    'settings.force_pw_title': 'Set your own password first',
    'settings.force_pw_desc': 'Your account was created by an administrator with a default password. For security, set a new password under "Change password" below before using other features.',
    'history.title': 'My ', 'history.accent': 'Records',
    'history.desc': 'All images you have analyzed and their AI scores. Click a column header to sort, click a row for details.',
    'history.total': 'Total Analyses', 'history.avg': 'Avg AI Score', 'history.best': 'Best Score', 'history.recent': 'Latest',
    'history.table_title': 'Analysis History', 'history.sort_hint': 'Click headers to sort', 'history.trend_title': 'Analysis Trend',
    'th.time': 'Time', 'th.filename': 'Filename', 'th.mode': 'Mode', 'th.ai': 'AI Score', 'th.ai_short': 'AI',
    'th.doctor': 'Facilitator Evaluation', 'th.doctor_short': 'Facilitator', 'th.error': 'Error',
    'th.damage': 'Damage %', 'th.damage_short': 'Damage', 'th.white': 'White %', 'th.white_short': 'White',
    'th.role': 'Role', 'th.count': 'Analyses', 'th.register_time': 'Joined', 'th.student': 'Student', 'th.actions': 'Actions',
    'mode.verify': 'Model Validation', 'mode.predict': 'AI-Assisted Evaluation',
    'mode.verify_full': 'Model Validation', 'mode.predict_full': 'AI-Assisted Evaluation',
    'admin.title': 'Admin ', 'admin.accent': 'Console',
    'admin.desc': 'View all student accounts and records. Click a student row for their records; click headers to sort.',
    'admin.export': 'Export All CSV', 'admin.students': 'User Accounts', 'admin.records': 'All Records',
    'admin.import': 'Import Accounts', 'admin.scroll_hint': 'Scroll to load more',
    'stats.students': 'Students', 'stats.analyses': 'Total Analyses', 'stats.verify': 'Verify Mode',
    'stats.hits': 'Class Hits', 'stats.mae': 'Avg Error',
    'admin.search_ph': 'Search filename...', 'admin.min_score': 'Min', 'admin.max_score': 'Max',
    'admin.all_modes': 'All Modes', 'admin.filter': 'Filter', 'admin.clear': 'Clear',
    'admin.delete_record': 'Delete', 'admin.confirm_del_record': 'Delete this record?',
    'admin.confirm_del_user': 'Delete this account and all its records? This cannot be undone.',
    'admin.make_admin': 'Make Admin', 'admin.make_student': 'Make Student', 'admin.del_user': 'Delete User',
    'admin.people': '',
    'settings.title': 'Settings', 'settings.appearance': 'Appearance', 'settings.theme': 'Theme',
    'settings.light': 'Light', 'settings.dark': 'Dark', 'settings.language': 'Language',
    'settings.account': 'Account', 'settings.profile': 'Profile', 'settings.email': 'Password reset email',
    'settings.email_hint': 'Password reset links are sent here. Gmail and other valid email providers are supported.',
    'settings.email_password': 'Enter your current password to change the email',
    'settings.save_profile': 'Save', 'settings.security': 'Security', 'settings.change_pw': 'Change Password',
    'settings.old_pw': 'Current Password', 'settings.new_pw': 'New Password', 'settings.new_pw2': 'Confirm New Password',
    'settings.change_pw_btn': 'Update Password', 'settings.prefs': 'Preferences',
    'settings.pw_hint': '(min 8 characters)',
    'settings.last_login': 'Last sign-in',
    'settings.last_login_hint': "If this wasn't you, change your password and sign out all devices immediately.",
    'settings.logout_all': 'Sign out all devices',
    'settings.logout_all_hint': 'Immediately signs out every computer and phone, including this device',
    'settings.logout_all_btn': 'Sign out all devices',
    'import.title': 'Import Accounts', 'import.desc': 'Upload a CSV. Each row: username,password,email,role (email & role optional)',
    'import.format': 'e.g. student01,pass123,s1@mail.com,student', 'import.choose': 'Choose CSV',
    'import.btn': 'Start Import', 'import.default_pw': 'Default password is citrus123 if blank',
    'import.default_pw_title': 'Blank passwords default to', 'import.default_pw_hint': '— tell those students to change it in Settings right after first login',
    'detail.title': 'Detection Details', 'detail.analyzing': 'Loading previous analysis…',
    'detail.summary': 'Assessment', 'detail.doctor_score': 'Facilitator Evaluation', 'detail.abs_error': 'Abs Error',
    'detail.new_case': 'AI-Assisted Evaluation', 'detail.damage_feat': 'Damage', 'detail.white_feat': 'White Residue',
    'detail.optics_feat': 'Optics', 'detail.damage_ratio': 'Damage Ratio', 'detail.damage_count': 'Damage Blocks',
    'detail.max_block': 'Largest Block', 'detail.confidence': 'Confidence', 'detail.white_ratio': 'White Ratio',
    'detail.white_count': 'White Blocks', 'detail.top3': 'Top 3 Ratio', 'detail.hsv_s': 'HSV Saturation',
    'detail.hsv_v': 'HSV Value', 'detail.lab_b': 'LAB B-value', 'detail.points': 'pts',
    'detail.orig': 'Original', 'detail.roi': 'Peel ROI', 'detail.white_det': 'White', 'detail.damage_det': 'Damage',
    'grade.excellent': 'Excellent', 'grade.good': 'Good', 'grade.fair': 'Fair', 'grade.poor': 'Poor',
    'common.cancel': 'Cancel', 'common.confirm': 'Confirm', 'common.save': 'Save', 'common.loading': 'Loading...',
    'common.empty': 'No records yet', 'common.back': '‹ Back to Admin', 'common.actions': 'Actions',
    'progress.analyzing': 'Analyzing...', 'progress.uploading': 'Uploading & analyzing...',
  },
};

// 補充字串 (新功能)
Object.assign(I18N.zh, {
  'role.ta': '助教',
  'login.forgot': '忘記密碼？',
  'forgot.title': '忘記密碼', 'forgot.subtitle': '輸入您註冊的 Email，我們會寄送重設連結',
  'forgot.email_ph': '輸入您的 Email', 'forgot.send': '寄送重設連結', 'forgot.back_login': '返回登入',
  'forgot.sent_title': '已寄出', 'forgot.sent_desc': '若該 Email 有註冊，您將收到重設連結，請檢查信箱（含垃圾郵件匣）。',
  'forgot.no_mail_setup': '系統尚未設定寄信，請使用下方連結直接重設：',
  'reset.title': '重設密碼', 'reset.subtitle': '請設定您的新密碼', 'reset.new_pw': '新密碼',
  'reset.new_pw2': '確認新密碼', 'reset.btn': '重設密碼',
  'reset.invalid_title': '連結無效', 'reset.invalid_desc': '此重設連結無效或已過期，請重新申請。',
  'reset.ph_new': '輸入新密碼', 'reset.ph_new2': '再次輸入新密碼',
  'toast.logged_out': '已登出', 'toast.reset_ok': '密碼已重設，請用新密碼登入',
  'admin.select_all': '全選', 'admin.del_selected': '刪除選取', 'admin.selected_count': '已選',
  'admin.confirm_batch': '確定刪除選取的紀錄？', 'admin.no_selection': '尚未選取任何紀錄',
  'admin.make_ta': '設為助教', 'admin.search_user_ph': '搜尋帳號...', 'admin.all_roles': '全部角色',
  'admin.date_from': '起始日', 'admin.date_to': '結束日',
  'chart.metric_ai': 'AI 評分', 'chart.metric_damage': '破皮比例', 'chart.metric_white': '白膜比例',
  'chart.zoom_hint': '滾輪縮放 · 拖曳平移 · 雙擊還原', 'chart.reset_zoom': '還原縮放',
  'chart.loading': '載入分析趨勢…', 'chart.sampled': '共 {total} 筆資料，本圖呈現 {rendered} 個代表點',
  'loading.data': '載入資料…', 'loading.stats': '載入統計資料…',
  'loading.records': '載入評分紀錄…', 'loading.users': '載入使用者帳號…',
  'mode.verify_tip': '檔名含分數，將 AI 評分與主持人評估對照，用於模型驗證',
  'mode.predict_tip': '檔名無分數時，使用 AI 輔助評估產生評分結果',
  'register.closed': '目前不開放自行註冊，請聯絡管理者建立帳號。',
  'auth.connection_error': '無法連線，請重試', 'auth.operation_failed': '操作失敗',
  'auth.completed': '完成，請登入', 'download.failed': '匯出失敗，請重試',
});
Object.assign(I18N.en, {
  'role.ta': 'TA',
  'login.forgot': 'Forgot password?',
  'forgot.title': 'Forgot Password', 'forgot.subtitle': 'Enter your registered email and we will send a reset link',
  'forgot.email_ph': 'Enter your email', 'forgot.send': 'Send Reset Link', 'forgot.back_login': 'Back to login',
  'forgot.sent_title': 'Email Sent', 'forgot.sent_desc': 'If that email is registered, you will receive a reset link. Please check your inbox (and spam).',
  'forgot.no_mail_setup': 'Email is not configured. Use this link to reset directly:',
  'reset.title': 'Reset Password', 'reset.subtitle': 'Set your new password', 'reset.new_pw': 'New Password',
  'reset.new_pw2': 'Confirm New Password', 'reset.btn': 'Reset Password',
  'reset.invalid_title': 'Invalid Link', 'reset.invalid_desc': 'This reset link is invalid or expired. Please request a new one.',
  'reset.ph_new': 'Enter new password', 'reset.ph_new2': 'Re-enter new password',
  'toast.logged_out': 'Logged out', 'toast.reset_ok': 'Password reset. Please sign in with your new password.',
  'admin.select_all': 'Select All', 'admin.del_selected': 'Delete Selected', 'admin.selected_count': 'Selected',
  'admin.confirm_batch': 'Delete selected records?', 'admin.no_selection': 'No records selected',
  'admin.make_ta': 'Make TA', 'admin.search_user_ph': 'Search username...', 'admin.all_roles': 'All Roles',
  'admin.date_from': 'From', 'admin.date_to': 'To',
  'chart.metric_ai': 'AI Score', 'chart.metric_damage': 'Damage %', 'chart.metric_white': 'White %',
  'chart.zoom_hint': 'Scroll to zoom · Drag to pan · Double-click to reset', 'chart.reset_zoom': 'Reset Zoom',
  'chart.loading': 'Loading analysis trend…', 'chart.sampled': 'Showing {rendered} representative points from {total} records',
  'loading.data': 'Loading data…', 'loading.stats': 'Loading statistics…',
  'loading.records': 'Loading assessment records…', 'loading.users': 'Loading user accounts…',
  'mode.verify_tip': 'A filename score is compared with the AI score for model validation',
  'mode.predict_tip': 'Images without filename scores use AI-assisted evaluation',
  'register.closed': 'Self-registration is currently closed. Please contact the administrator.',
  'auth.connection_error': 'Unable to connect. Please try again.', 'auth.operation_failed': 'Operation failed',
  'auth.completed': 'Completed. Please sign in.', 'download.failed': 'Export failed. Please try again.',
});

// UI 升級字串 (掃描佇列 / 影像檢視器 / 貼上提示)
Object.assign(I18N.zh, {
  'index.paste_hint': '提示：也可直接按 Ctrl + V 貼上剪貼簿中的影像',
  'preview.queued': '佇列中', 'preview.scanning': 'AI 掃描中', 'preview.done': '完成',
  'progress.done': '分析完成', 'progress.failed': '分析失敗',
  'progress.warming': '首次分析需載入 AI 模型，請稍候…',
  'progress.timeout': '分析逾時，請重試；張數較多時請分批上傳',
  'progress.timeout_single': '此影像分析逾時，已繼續處理下一張',
  'progress.connection_error': '連線失敗，已繼續處理下一張',
  'progress.busy': '目前仍在分析上一批影像',
  'progress.not_image': '請選擇影像檔 (JPG / PNG / HEIC)',
  'analysis.invalid_peel_subject': '未偵測到有效的橘子皮本體，請上傳主體清楚、完整入鏡且符合拍攝範例的訓練影像',
  'restore.note': '以下是你上次的分析結果',
  'a11y.skip': '跳至主要內容',
  'a11y.show_password': '顯示密碼', 'a11y.hide_password': '隱藏密碼',
  'restore.clear': '清除',
  'toast.session_expired': '登入逾時，請重新登入',
  'history.export': '匯出 CSV',
  'error.home': '回到首頁',
  'onboard.title': 'AI 評分流程',
  'onboard.s1_t': '圖像捕捉與處理', 'onboard.s1_d': '上傳一張或多張柑橘剝皮模擬訓練影像',
  'onboard.s2_t': 'AI 輔助評估', 'onboard.s2_d': '系統分析完整性、清潔度與相關圖像特徵',
  'onboard.s3_t': 'AI 評分結果', 'onboard.s3_d': '輸出 0–100 分與等第，並比較原始影像與處理結果',
  'empty.history_title': '還沒有任何分析紀錄', 'empty.history_desc': '到「分析」頁上傳第一張橘子皮影像，結果會自動存到這裡。',
  'empty.records_title': '目前沒有評分紀錄', 'empty.records_desc': '學生上傳影像分析後，紀錄會出現在這裡。',
  'lb.compare': '對比原圖', 'lb.before': '偵測前', 'lb.after': '偵測後',
  'lb.hint': '← → 切換視圖 · 拖曳分隔線對比 · Esc 關閉',
});
Object.assign(I18N.en, {
  'index.paste_hint': 'Tip: you can also paste images from the clipboard (Ctrl + V)',
  'preview.queued': 'Queued', 'preview.scanning': 'Scanning', 'preview.done': 'Done',
  'progress.done': 'Done', 'progress.failed': 'Analysis failed',
  'progress.warming': 'Loading the AI model for the first run, please wait…',
  'progress.timeout': 'Analysis timed out. Please retry, or upload in smaller batches.',
  'progress.timeout_single': 'This image timed out. Continuing with the next image.',
  'progress.connection_error': 'Connection failed. Continuing with the next image.',
  'progress.busy': 'The previous batch is still being analyzed.',
  'progress.not_image': 'Please choose an image file (JPG / PNG / HEIC)',
  'analysis.invalid_peel_subject': 'No valid citrus-peel subject was detected. Upload a clear, fully visible training image that follows the capture example.',
  'restore.note': 'Showing your previous analysis results',
  'a11y.skip': 'Skip to main content',
  'a11y.show_password': 'Show password', 'a11y.hide_password': 'Hide password',
  'restore.clear': 'Clear',
  'toast.session_expired': 'Session expired. Please sign in again.',
  'history.export': 'Export CSV',
  'error.home': 'Back to Home',
  'onboard.title': 'AI-Assisted Scoring Process',
  'onboard.s1_t': 'Image Capture and Processing', 'onboard.s1_d': 'Upload one or more citrus peel simulation training images',
  'onboard.s2_t': 'AI-Assisted Evaluation', 'onboard.s2_d': 'The system analyzes integrity, cleanliness, and related image features',
  'onboard.s3_t': 'AI Scoring Result', 'onboard.s3_d': 'View the 0–100 score and grade, then compare the original and processed images',
  'empty.history_title': 'No analysis records yet', 'empty.history_desc': 'Upload your first citrus-peel image on the Analyze page — results appear here automatically.',
  'empty.records_title': 'No records yet', 'empty.records_desc': 'Records appear here once students upload and analyze images.',
  'lb.compare': 'Compare', 'lb.before': 'Before', 'lb.after': 'After',
  'lb.hint': '← → switch views · drag divider to compare · Esc to close',
});

function getLang() {
  try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; }
}

function t(key) {
  const lang = getLang();
  return (I18N[lang] && I18N[lang][key]) || (I18N.zh[key]) || key;
}

function applyI18n() {
  const lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = (I18N[lang] && I18N[lang][key]);
    if (val !== undefined) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = (I18N[lang] && I18N[lang][key]);
    if (val !== undefined) el.setAttribute('placeholder', val);
  });
  document.querySelectorAll('[data-i18n-lang]').forEach(el => { el.value = lang; });
  const pageKey = document.body && document.body.getAttribute('data-page-i18n');
  if (pageKey) {
    const title = (I18N[lang] && I18N[lang]['page.' + pageKey]);
    if (title) document.title = title;
  }
}

function setLang(lang) {
  const current = getLang();
  const commitLanguage = () => {
    try { localStorage.setItem('lang', lang); } catch (e) {}
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
    applyI18n();
    // 通知頁面重新渲染動態內容 (表格等)
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  };
  if (current === lang) { commitLanguage(); return; }

  // Chromium 原生 View Transition 會保留舊畫面到新語言完成排版，再柔和交接，
  // 避免中英文長度不同造成使用者看到突兀的瞬間位移。
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduceMotion) {
    document.documentElement.classList.add('language-transitioning');
    const transition = document.startViewTransition(commitLanguage);
    transition.finished.finally(() => document.documentElement.classList.remove('language-transitioning'));
  } else {
    commitLanguage();
  }
}

function setTheme(theme) {
  try { localStorage.setItem('theme', theme); } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
}

function getTheme() {
  try { return localStorage.getItem('theme') || 'dark'; } catch (e) { return 'dark'; }
}

document.addEventListener('DOMContentLoaded', applyI18n);

/* ==========================================================================
   Toast 通知 (右上角浮動，自動消失) — 取代醜橫條
   ========================================================================== */
function showToast(message, type) {
  type = type || 'success';
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  wrap.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// 登入頁的 ?msg= 提示
document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(location.search);
  const msg = params.get('msg');
  if (msg === 'logged_out') showToast(t('toast.logged_out'), 'success');
  else if (msg === 'reset_ok') showToast(t('toast.reset_ok'), 'success');
});
