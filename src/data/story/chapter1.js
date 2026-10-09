// Chapter I storyboards derived from LORE.docx; dialogues and stage directions are production additions.
// Stage 1-10 does not exist yet. The ending is a preview until that boss is implemented.
export const CHAPTER_ONE_CUTSCENES = Object.freeze({
  intro: {
    id: "CH1_INTRO",
    eyebrow: "TRUYỀN THUYẾT CỬU GIỚI",
    title: "KẺ KHÔNG KÝ ỨC",
    chapter: "CHƯƠNG I · THANH MỘC GIỚI",
    next: "1-1",
    shots: [
      {
        title: "KÝ ỨC TAN VỠ", duration: 7000,
        background: "BG_W01_BOSS_BRIARHEART_SANCTUARY", mood: "void",
        figure: "crystal", movement: "rush",
        dialogue: [{ name: "Giọng nói bí ẩn", text: "Đừng... để mọi thứ kết thúc..." }],
      },
      {
        title: "GIỮA RỪNG CỔ ĐẠI", duration: 8000,
        background: "BG_W01_COMMON_WHISPERING_WILDS", mood: "dawn",
        figure: "wanderer", movement: "rise",
        dialogue: [{ name: "Người lữ hành", text: "Đây là... đâu? Mình là ai?" }],
      },
      {
        title: "CÔ GÁI TÊN LY", duration: 10000,
        background: "BG_W01_WHISPERING_FOREST", mood: "dawn",
        figure: "ly", movement: "push",
        dialogue: [
          { name: "Ly", text: "Cuối cùng anh cũng tỉnh rồi!" },
          { name: "Người lữ hành", text: "Cô là ai? Tôi... không nhớ gì cả." },
          { name: "Ly", text: "Em là Ly. Còn anh... em cũng không biết." },
        ],
      },
      {
        title: "MẢNH TINH THỂ", duration: 7500,
        background: "BG_W01_WOOD_TEMPLE", mood: "magic",
        figure: "crystal", movement: "push",
        dialogue: [
          { name: "Ly", text: "Mảnh tinh thể này đã phản ứng khi anh tỉnh lại..." },
          { name: "Ly", text: "Có lẽ nó sẽ giúp chúng ta tìm ra sự thật." },
        ],
      },
      {
        title: "TIẾNG KÊU CỨU", duration: 8500,
        background: "BG_W01_VILLAGE", mood: "danger",
        figure: "ly", movement: "rush",
        dialogue: [
          { name: "Ly", text: "Nhìn kìa! Ngôi làng đang bị tấn công!" },
          { name: "Người lữ hành", text: "Đi thôi. Chúng ta phải giúp họ!" },
        ],
      },
    ],
  },
  ending: {
    id: "CH1_ENDING",
    eyebrow: "TRUYỀN THUYẾT CỬU GIỚI",
    title: "MA VƯƠNG ĐÃ TRỞ LẠI",
    chapter: "CHƯƠNG I · HỒI KẾT",
    next: "chapter-select",
    shots: [
      {
        title: "CỔ THỤ GỤC NGÃ", duration: 7500,
        background: "BG_W01_BOSS_BRIARHEART_SANCTUARY", mood: "relief",
        figure: "boss", movement: "fall",
        dialogue: [{ name: "Mộc Tẫn", text: "Ta... đã làm gì với khu rừng này...?" }],
      },
      {
        title: "KHU RỪNG ĐƯỢC CỨU", duration: 8000,
        background: "BG_W01_COMMON_WHISPERING_WILDS", mood: "dawn",
        figure: "aria", movement: "push",
        dialogue: [
          { name: "Aria", text: "Ngài đã trở lại... Khu rừng được cứu rồi!" },
          { name: "Mộc Tẫn", text: "Không... bóng tối ấy vẫn chưa biến mất..." },
        ],
      },
      {
        title: "DANH XƯNG BỊ LÃNG QUÊN", duration: 8500,
        background: "BG_W01_BOSS_BRIARHEART_SANCTUARY", mood: "reveal",
        figure: "boss", movement: "rush",
        dialogue: [
          { name: "Mộc Tẫn", text: "Khí tức này..." },
          { name: "Mộc Tẫn", text: "Ma Vương đã trở lại." },
        ],
      },
      {
        title: "NGHI VẤN", duration: 8500,
        background: "BG_W01_WHISPERING_FOREST", mood: "night",
        figure: "ly", movement: "push",
        dialogue: [
          { name: "Người lữ hành", text: "Ma Vương? Ông đang nói đến ai?" },
          { name: "Ly", text: "Em không biết. Nhưng chúng ta sẽ tìm ra sự thật." },
        ],
      },
      {
        title: "CÁNH CỔNG XÍCH VIÊM", duration: 8000,
        background: "1929ad4a-2112-4ffa-aed6-75ba7c6c0cd2", mood: "fire",
        figure: "portal", movement: "rush",
        dialogue: [
          { name: "Ly", text: "Giới Tinh đã mở ra con đường mới..." },
          { name: "Ly", text: "Bên kia cánh cổng có thể có câu trả lời." },
        ],
      },
    ],
  },
});
