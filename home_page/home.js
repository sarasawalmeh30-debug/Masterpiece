

const cards = document.querySelectorAll('.carousel-card');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');

let currentIndex = 1; // البطاقة الافتراضية في المنتصف

// إنشاء النقاط بناءً على عدد الكاردات
cards.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (index === currentIndex) dot.classList.add('active');
    dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
    dotsContainer.appendChild(dot);
});

const dots = document.querySelectorAll('.dot');

function updateCarousel() {
    const totalCards = cards.length;
    
    cards.forEach((card, index) => {
        // حساب المسافة النسبية لكل كارد مقارنة بالكارد الحالي
        let offset = (index - currentIndex + totalCards) % totalCards;
        
        // تعديل لحساب الأبعاد بطريقة دائرية (Circular logic)
        if (offset > totalCards / 2) {
            offset -= totalCards;
        }

        // تطبيق التنسيقات بناءً على موقع الكارد (المتوسط، اليمين، اليسار، والخلف)
        if (offset === 0) {
            // الكارد النشط في المنتصف
            card.style.transform = 'translateX(0) scale(1) translateZ(0)';
            card.style.zIndex = '5';
            card.style.opacity = '1';
            card.style.filter = 'brightness(1)';
        } else if (offset === 1) {
            // الكارد على اليمين القريب
            card.style.transform = 'translateX(130px) scale(0.85) translateZ(-100px)';
            card.style.zIndex = '3';
            card.style.opacity = '0.7';
            card.style.filter = 'brightness(0.7)';
        } else if (offset === -1 || offset === totalCards - 1) {
            // الكارد على اليسار القريب
            card.style.transform = 'translateX(-130px) scale(0.85) translateZ(-100px)';
            card.style.zIndex = '3';
            card.style.opacity = '0.7';
            card.style.filter = 'brightness(0.7)';
        } else {
            // الكاردات البعيدة جداً في الخلف
            card.style.transform = `translateX(${offset * 180}px) scale(0.7) translateZ(-200px)`;
            card.style.zIndex = '1';
            card.style.opacity = '0.3';
            card.style.filter = 'brightness(0.4)';
        }
    });

    // تحديث تفعيل النقاط
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
    });
}

// الضغط على الكاردات نفسها ليتم جلبها للأمام
cards.forEach((card, index) => {
    card.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
});

// أزرار التالي والسابق
nextBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % cards.length;
    updateCarousel();
});

prevBtn.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateCarousel();
});

// التشغيل الأولي لتنظيم الكاردات
updateCarousel();
