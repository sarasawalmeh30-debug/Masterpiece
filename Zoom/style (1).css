// ننتظر حتى يتم تحميل كامل محتوى الصفحة
window.onload = () => {
    // اسم النطاق الذي سنستخدمه (الخادم العام لـ Jitsi)
    const domain = 'meet.jit.si';

    // إعدادات الاجتماع
    const options = {
        // اسم الغرفة (يمكنك تغييره ديناميكيًا)
        roomName: 'MyAwesomeMeeting123',
        
        // أبعاد نافذة الاجتماع
        width: 800,
        height: 600,
        
        // العنصر الأب الذي سيحتوي على الاجتماع (الـ div الذي أنشأناه في HTML)
        parentNode: document.querySelector('#meet'),
        
        // يمكنك إضافة إعدادات أخرى هنا
        // مثال: لتعيين اسم المشارك
        // userInfo: {
        //     displayName: 'اسم المستخدم'
        // },
        
        // لإخفاء بعض الأزرار (اختياري)
        // configOverwrite: {
        //     'toolbarButtons': [
        //         'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        //         'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
        //         'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
        //         'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
        //         'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
        //     ],
        // },
    };

    // إنشاء كائن جديد من JitsiMeetExternalAPI
    const api = new JitsiMeetExternalAPI(domain, options);
};