// script.js (Final Version for Netlify Deployment)
document.addEventListener('DOMContentLoaded', function() {
    const prayerNames = {
        "fajr": "الفجر",
        "shuruq": "الشروق",
        "dhuhr": "الظهر",
        "asr": "العصر",
        "maghrib": "المغرب",
        "isha": "العشاء"
    };

    const prayerTimesBody = document.getElementById('prayer-times-body');
    const nextPrayerNameEl = document.getElementById('next-prayer-name');
    const countdownTimerEl = document.getElementById('countdown-timer');
    const dateDisplayEl = document.getElementById('date-display');
    
    // معرف المسجد: مسجد سمية بنت الخياط، تليلات
    const mosqueId = '31032';
    
    // --- هذا هو السطر الذي تم تعديله ---
    // يطلب البيانات من مسار محلي سيقوم Netlify بتوجيهه
    const apiUrl = `/api/mosquee/${mosqueId}`;

    let prayerTimesData = {}; // سيتم ملؤها من الـ API

    // دالة لجلب وعرض البيانات
    async function fetchAndDisplayData() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('فشل في جلب البيانات من الشبكة');
            }
            const data = await response.json();
            
            // استخراج مواقيت الصلاة لليوم الحالي
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const todayPrayers = data.prayers[today];

            if (!todayPrayers) {
                throw new Error('لا توجد مواقيت صلاة متاحة لهذا اليوم');
            }

            // تنسيق البيانات بالشكل المطلوب (HH:mm)
            prayerTimesData = {
                "fajr": todayPrayers.fajr.adhan.slice(0, 5),
                "shuruq": todayPrayers.shuruq.slice(0, 5),
                "dhuhr": todayPrayers.dhuhr.adhan.slice(0, 5),
                "asr": todayPrayers.asr.adhan.slice(0, 5),
                "maghrib": todayPrayers.maghrib.adhan.slice(0, 5),
                "isha": todayPrayers.isha.adhan.slice(0, 5)
            };

            // عرض كل شيء بعد جلب البيانات بنجاح
            displayDates();
            displayPrayerTimes();
            updateCountdown(); // أول تحديث فوري
            setInterval(updateCountdown, 1000); // تحديث العداد كل ثانية

        } catch (error) {
            console.error('حدث خطأ:', error);
            prayerTimesBody.innerHTML = `<tr><td colspan="2" style="color: red;">حدث خطأ أثناء تحميل مواقيت الصلاة. يرجى المحاولة مرة أخرى.</td></tr>`;
        }
    }

    function displayDates() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const gregorianDate = new Intl.DateTimeFormat('ar-u-nu-latn', options).format(today);
        const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', options).format(today);
        const hijriDateWithoutDay = hijriDate.split('،').slice(1).join('،').trim();
        dateDisplayEl.textContent = `${gregorianDate} | ${hijriDateWithoutDay}`;
    }

    function displayPrayerTimes() {
        prayerTimesBody.innerHTML = '';
        // عرض الصلوات بالترتيب الصحيح
        const prayerOrder = ["fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"];
        prayerOrder.forEach(prayerKey => {
            if (prayerTimesData[prayerKey]) {
                const time = prayerTimesData[prayerKey];
                const row = document.createElement('tr');
                row.id = `prayer-${prayerKey}`;
                // لا نعرض الشروق في الجدول الرئيسي للصلوات الخمس
                if (prayerKey !== 'shuruq') {
                    row.innerHTML = `<td>${prayerNames[prayerKey]}</td><td>${time}</td>`;
                    prayerTimesBody.appendChild(row);
                }
            }
        });
    }

    function updateCountdown() {
        const now = new Date();
        let nextPrayerTime = null;
        let nextPrayerName = null;

        const sortedPrayers = Object.entries(prayerTimesData)
            .filter(([name]) => name !== 'shuruq') // تجاهل الشروق عند حساب الصلاة القادمة
            .sort((a, b) => a[1].localeCompare(b[1]));

        for (const [prayer, time] of sortedPrayers) {
            const [hours, minutes] = time.split(':');
            const prayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);

            if (prayerDate > now) {
                nextPrayerTime = prayerDate;
                nextPrayerName = prayer;
                break;
            }
        }

        if (!nextPrayerTime) {
            const [fajrHours, fajrMinutes] = sortedPrayers[0][1].split(':');
            nextPrayerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, fajrHours, fajrMinutes);
            nextPrayerName = sortedPrayers[0][0];
        }

        nextPrayerNameEl.textContent = prayerNames[nextPrayerName];
        document.querySelectorAll('.prayer-times tr').forEach(row => row.classList.remove('next-prayer'));
        const nextPrayerRow = document.getElementById(`prayer-${nextPrayerName}`);
        if (nextPrayerRow) {
            nextPrayerRow.classList.add('next-prayer');
        }

        const diff = nextPrayerTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownTimerEl.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- التشغيل ---
    fetchAndDisplayData();
});
