import { useState } from "react";
import SelectionTool from "../components/SelectionTool";
import ResponsePanel from "../components/ResponsePanel";
import HistoryPanel from "../components/HistoryPanel";
import { Button } from "../components/ui/button";
import { Crosshair, History } from "lucide-react";

const Index = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);

  const questions = [
    {
      id: 1,
      title: "Soalan 1:",
      text: "Apabila Yang di-Pertuan Agong melantik Perdana Menteri, baginda hendaklah memilih seorang ahli Dewan Rakyat yang boleh mendapat sokongan majoriti dan ia mestilah seorang yang",
      instruction: "Sila pilih teks yang berkaitan dari artikel untuk menyokong jawapan anda.",
      options: [
        "A. Beragama Islam",
        "B. Keturunan Melayu",
        "C. Pernah menjadi Menteri Kabinet",
        "D. Menjadi warganegara mengikut operasi undang-undang"
      ]
    },
    {
      id: 2,
      title: "Soalan 2:",
      text: "Deklarasi Kuala Lumpur 1971 ialah satu persetujuan mengenai",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Penubuhan ASEAN",
        "B. Penubuhan pasaran bersama untuk ASEAN",
        "C. Pakatan ketenteraan di antara negara-negara ASEAN",
        "D. Penubuhan kawasan aman, bebas dan berkecuali di Asia Tenggara"
      ]
    },
    {
      id: 3,
      title: "Soalan 3:",
      text: "Perlembagaan Persekutuan memperuntukkan bahawa bahasa kebangsaan Malaysia ialah",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Bahasa Malaysia",
        "B. Bahasa Melayu",
        "C. Bahasa Kebangsaan",
        "D. Bahasa Rasmi"
      ]
    },
    {
      id: 4,
      title: "Soalan 4:",
      text: "Sistem federalisme di Malaysia bermaksud",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Kuasa pemerintahan dibahagikan antara kerajaan persekutuan dengan kerajaan negeri",
        "B. Kuasa pemerintahan terletak sepenuhnya pada kerajaan persekutuan",
        "C. Kuasa pemerintahan terletak sepenuhnya pada kerajaan negeri",
        "D. Kuasa pemerintahan dibahagikan antara eksekutif, legislatif dan kehakiman"
      ]
    },
    {
      id: 5,
      title: "Soalan 5:",
      text: "Yang di-Pertuan Agong dilantik oleh",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Perdana Menteri",
        "B. Majlis Raja-Raja",
        "C. Parlimen",
        "D. Rakyat melalui pilihanraya"
      ]
    },
    {
      id: 6,
      title: "Soalan 6:",
      text: "Rukun Negara diisytiharkan pada tahun",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. 1957",
        "B. 1963",
        "C. 1970",
        "D. 1971"
      ]
    },
    {
      id: 7,
      title: "Soalan 7:",
      text: "Dasar Ekonomi Baru (DEB) dilaksanakan untuk tempoh",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. 10 tahun",
        "B. 15 tahun",
        "C. 20 tahun",
        "D. 25 tahun"
      ]
    },
    {
      id: 8,
      title: "Soalan 8:",
      text: "Perjanjian Malaysia 1963 melibatkan penggabungan",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Tanah Melayu, Singapura, Sabah dan Sarawak",
        "B. Tanah Melayu, Sabah dan Sarawak",
        "C. Tanah Melayu dan Singapura sahaja",
        "D. Tanah Melayu, Singapura dan Brunei"
      ]
    },
    {
      id: 9,
      title: "Soalan 9:",
      text: "Mahkamah Persekutuan merupakan",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Mahkamah terendah di Malaysia",
        "B. Mahkamah tertinggi di Malaysia",
        "C. Mahkamah rayuan terakhir",
        "D. Mahkamah khas untuk kes-kes persekutuan"
      ]
    },
    {
      id: 10,
      title: "Soalan 10:",
      text: "Dewan Negara dianggotai oleh",
      instruction: "Sila pilih teks yang berkaitan dari artikel.",
      options: [
        "A. Wakil rakyat yang dipilih melalui pilihanraya",
        "B. Senator yang dilantik oleh Yang di-Pertuan Agong",
        "C. Wakil dari setiap negeri",
        "D. Ahli yang dilantik oleh Perdana Menteri"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <header className="bg-white shadow-sm py-4 px-8">
        <nav className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Platform Kuiz Malaysia</h1>
          <div className="space-x-4">
            <span className="text-gray-600">Utama</span>
            <span className="text-gray-600">Soalan</span>
            <span className="text-gray-600">Profil</span>
          </div>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose lg:prose-xl">
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question.id} className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-2">{question.title}</h2>
                <p className="text-blue-800 mb-4">{question.text}</p>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="pl-4 text-blue-700">
                      {option}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-600 mt-4 italic">{question.instruction}</p>
              </div>
            ))}
          </div>

          <article className="mt-8">
            <h2 className="text-3xl font-bold mb-4">Sistem Perlembagaan Malaysia</h2>
            <p className="text-gray-700 mb-4">
              Malaysia merupakan sebuah negara yang mengamalkan sistem demokrasi berparlimen 
              dengan Yang di-Pertuan Agong sebagai Ketua Negara. Dalam proses pelantikan 
              Perdana Menteri, Yang di-Pertuan Agong akan memilih seorang ahli Dewan Rakyat 
              yang menjadi warganegara mengikut operasi undang-undang dan mendapat sokongan 
              majoriti ahli Dewan Rakyat.
            </p>
            <h3 className="text-2xl font-semibold mb-3">Sejarah Diplomatik</h3>
            <p className="text-gray-700 mb-4">
              Pada tahun 1971, Deklarasi Kuala Lumpur telah ditandatangani yang membawa kepada 
              penubuhan kawasan aman, bebas dan berkecuali di Asia Tenggara. Ini merupakan 
              satu pencapaian penting dalam sejarah diplomatik rantau ini.
            </p>
          </article>
        </div>
      </main>

      <footer className="bg-gray-100 py-6 px-8 mt-8">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          © 2024 Platform Kuiz Malaysia. Hak cipta terpelihara.
        </div>
      </footer>

      {!isSelecting && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          <Button
            onClick={() => setShowHistory(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <History className="h-6 w-6" />
          </Button>
          <Button
            onClick={() => setIsSelecting(true)}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Crosshair className="h-6 w-6" />
          </Button>
        </div>
      )}

      {isSelecting && (
        <SelectionTool
          onComplete={(text) => {
            setIsSelecting(false);
            setResponse(text);
          }}
          onCancel={() => setIsSelecting(false)}
        />
      )}

      {response && <ResponsePanel text={response} onClose={() => setResponse("")} />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
};

export default Index;