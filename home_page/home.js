

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
            card.style.width = '440px';
            card.style.transform = 'translateX(0) scale(1.03) translateZ(0)';
            card.style.zIndex = '5';
            card.style.opacity = '1';
            card.style.filter = 'brightness(1)';
        } else if (offset === 1) {
            // الكارد على اليمين القريب
            card.style.width = '400px';
            card.style.transform = 'translateX(190px) scale(0.85) translateZ(-100px)';
            card.style.zIndex = '3';
            card.style.opacity = '0.7';
            card.style.filter = 'brightness(0.7)';
        } else if (offset === -1 || offset === totalCards - 1) {
            // الكارد على اليسار القريب
            card.style.width = '400px';
            card.style.transform = 'translateX(-190px) scale(0.85) translateZ(-100px)';
            card.style.zIndex = '3';
            card.style.opacity = '0.7';
            card.style.filter = 'brightness(0.7)';
        } else {
            // الكاردات البعيدة جداً في الخلف
            card.style.width = '400px';
            const direction = Math.sign(offset);
            const distance = 360 + (Math.abs(offset) - 2) * 220;
            card.style.transform = `translateX(${direction * distance}px) scale(0.55) translateZ(-200px)`;
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
        const service = card.querySelector('h3')?.textContent.trim();
        if (!service) return;
        window.location.href = `../select_provider/select_provider.html?service=${encodeURIComponent(service)}`;
    });
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Browse ${card.querySelector('h3')?.textContent.trim()} providers`);
    card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
        }
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

// Reveal the home page copy section by section as it enters the viewport.
const homeMain = document.querySelector('main');
const ctaSection = document.querySelector('.cta-section');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const homeTextSelector = 'h1, h2, h3, p, .section-label, .hero-label, .card-btn, .step-number, .faq-item summary, .hero-actions .btn';

if (homeMain && !reducedMotion && 'IntersectionObserver' in window) {
    const homeText = Array.from(homeMain.querySelectorAll(homeTextSelector))
        .filter((item) => !item.closest('.cta-section'));
    const revealGroups = new Map();
    homeText.forEach((item) => {
        const group = item.closest('.hero-content, .header-content, .section-heading, .option-card, .carousel-card, .step-card, .benefit-card, .faq-item') || item.parentElement;
        if (!revealGroups.has(group)) revealGroups.set(group, []);
        revealGroups.get(group).push(item);
        item.classList.add('scroll-reveal');
    });
    revealGroups.forEach((items) => {
        items.forEach((item, index) => item.style.setProperty('--home-reveal-delay', `${Math.min(index, 3) * 110}ms`));
    });
    document.body.classList.add('js-home-scroll-motion');

    const homeTextObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('is-revealed', entry.isIntersecting);
        });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    homeText.forEach((item) => homeTextObserver.observe(item));
}

// Reveal the home page CTA in sequence as it enters view.
const ctaButton = ctaSection && ctaSection.querySelector('.btn-cta');

if (ctaSection && !reducedMotion && 'IntersectionObserver' in window) {
    document.body.classList.add('js-cta-motion');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => ctaSection.classList.toggle('is-visible', entry.isIntersecting));
    }, { threshold: 0.18 });
    sectionObserver.observe(ctaSection);

    const revealItems = ctaSection.querySelectorAll('.cta-reveal');
    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            entry.target.classList.toggle('is-revealed', entry.isIntersecting);
        });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => textObserver.observe(item));
} else if (ctaSection) {
    ctaSection.classList.add('is-visible');
    ctaSection.querySelectorAll('.cta-reveal').forEach((item) => item.classList.add('is-revealed'));
}

if (ctaButton && !reducedMotion) {
    ctaButton.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        const colors = ['#A8C9A5', '#6F9B73', '#D7BC78', '#FFFFFF'];
        for (let index = 0; index < 32; index += 1) {
            const spark = document.createElement('span');
            const isBubble = index < 24;
            const angle = (Math.PI * 2 * index) / 32 + Math.random() * 0.3;
            const distance = isBubble ? 36 + Math.random() * 54 : 24 + Math.random() * 32;
            spark.className = isBubble ? 'cta-click-bubble' : 'cta-click-spark';
            spark.style.setProperty('--spark-x', `${Math.cos(angle) * distance}px`);
            spark.style.setProperty('--spark-y', `${Math.sin(angle) * distance}px`);
            spark.style.setProperty('--spark-color', colors[index % colors.length]);
            if (isBubble) spark.style.setProperty('--bubble-size', `${6 + Math.random() * 10}px`);
            ctaButton.appendChild(spark);
            spark.addEventListener('animationend', () => spark.remove(), { once: true });
        }
        window.setTimeout(() => { window.location.href = ctaButton.href; }, 380);
    });
}
