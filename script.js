async function fetchPrayerTimes() {
    // نستخدم المسار المحلي الذي قمنا بتعريفه في vercel.json
    // هذا المسار سيقوم Vercel بتحويله إلى mawaqit.net في الخلفية (Server-side)
    // مما يحل مشكلة CORS تماماً
    const url = '/api/mawaqit';
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('فشل جلب البيانات من المصدر');
        
        const html = await response.text();

        // البحث عن confData في كود الصفحة باستخدام Regex
        // هذا المتغير يحتوي على كل مواقيت الصلاة للسنة كاملة واليوم الحالي
        const searchString = /(?:var|let)\s+confData\s*=\s*({.*?});/s;
        const match = html.match(searchString);

        if (match && match[1]) {
            const confData = JSON.parse(match[1]);
            displayPrayerTimes(confData);
        } else {
            throw new Error('لم يتم العثور على بيانات المواقيت في الصفحة');
        }
    } catch (error) {
        console.error('Error fetching prayer times:', error);
        document.getElementById('prayer-list').innerHTML = '<p style="color: red; text-align: center;">حدث خطأ أثناء تحميل مواقيت الصلاة. يرجى التأكد من رفع ملف vercel.json</p>';
    }
}

function displayPrayerTimes(data) {
    // المواقيت تكون في مصفوفة: [الفجر، الشروق، الظهر، العصر، المغرب، العشاء]
    const times = data.times; 
    const prayerNames = ['الفجر', 'الشروق', 'الظهر', 'العصر', 'المغرب', 'العشاء'];
    
    let html = '';
    prayerNames.forEach((name, index) => {
        html += `
            <div class="prayer-row" style="display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;">
                <span class="prayer-name" style="font-weight: bold;">${name}</span>
                <span class="prayer-time">${times[index]}</span>
            </div>
        `;
    });
    
    document.getElementById('prayer-list').innerHTML = html;
    
    // تحديث اسم المسجد من البيانات
    if (data.name) {
        document.getElementById('mosque-name').innerText = data.name;
    }
}

function updateDateTime() {
    const now = new Date();
    
    // تنسيق التاريخ الميلادي بالأرقام العربية (123)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let gregorianDate = now.toLocaleDateString('ar-DZ', options);
    
    // التأكد من أن الأرقام هي 123 وليست الهندية
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    arabicNumbers.forEach((num, i) => {
        gregorianDate = gregorianDate.replace(new RegExp(num, 'g'), i);
    });
    
    document.getElementById('gregorian-date').innerText = gregorianDate;
}

// التشغيل عند تحميل الصفحة
window.onload = () => {
    updateDateTime();
    fetchPrayerTimes();
    setInterval(updateDateTime, 60000);} // تحديث كل دقيقة
