import MainTemplate from '@/components/layout/main-template/MainTemplate';

export default function ContactsPage() {
  return (
    <MainTemplate>
      <div className="wrapper py-10 flex flex-col items-center mt-10!">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8 text-center">
          Контакты
        </h1>

        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl px-8 md:px-12 py-10">
          <h2 className="text-xl md:text-2xl font-semibold text-center text-gray-900 mb-6">
            Офис в Армении
          </h2>
          <div className="flex justify-center mb-8">
            <span className="inline-block h-[3px] w-24 bg-[#E21321] rounded-full" />
          </div>

          <div className="flex flex-col gap-4 text-sm md:text-base text-gray-800 mb-8">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                <i className="fa-solid fa-envelope text-gray-600 text-sm" />
              </span>
              <span>info@myauto.am</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                <i className="fa-solid fa-location-dot text-gray-600 text-sm" />
              </span>
              <span>г. Ереван, 0019, Айгедзор 5</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center">
                <i className="fa-solid fa-phone text-gray-600 text-sm" />
              </span>
              <span>+374 11 33 02 22</span>
            </div>
          </div>

          <div className="w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
            <iframe
              title="MyAuto Armenia Office"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.03791841273!2d44.5019!3d40.1872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2z0JDQstGC0L7RgNC40Lk!5e0!3m2!1sru!2sam!4v1700000000000"
              width="100%"
              height="280"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0"
            />
          </div>
        </div>
      </div>
    </MainTemplate>
  );
}
