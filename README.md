# Messenger & Zalo Redis Message Debouncer (TypeScript)

Xử lý gom cụm tin nhắn liên tiếp (*"Shop ơi" → "áo đen" → "size L" → [ảnh]*) trong cửa sổ trượt 4.5 giây trước khi gọi AI Agent, chống race condition mất tin và hỗ trợ **Auto-Handover** khi nhân viên thật nhảy vào chat.

## Điểm cốt lõi
- **Trailing Sliding Window**: Chỉ luồng giữ token cuối cùng mới được xử lý.
- **Atomic Drain (`MULTI lrange + del`)**: Xoá buffer ngay trước khi gọi LLM, không bao giờ xoá nhầm tin khách nhắn thêm trong lúc AI đang suy luận.
- **Auto-Handover (`isHumanAgentEcho`)**: Tự ngắt AI 30 phút ngay khi sale nhắn tay trực tiếp.

## Tài liệu đầy đủ & Luồng n8n 5-Node
- Bài hướng dẫn chi tiết: **[Xử Lý Debounce Gom Tin Nhắn Messenger & Zalo Bằng Redis/Node.js & n8n](https://seotrum.com/blog/xu-ly-debounce-gom-tin-nhan-messenger-zalo-chatbot-ai)**
- Giải pháp hợp nhất inbox FB/Zalo 24/7: **[Tự Động Hoá Facebook & Zalo Bằng AI | Sèo Trum](https://seotrum.com/tu-dong-hoa/tu-dong-hoa-facebook-zalo)**
- Tác giả: **[Kỹ sư Trần Như Ý](https://seotrum.com/tran-nhu-y)**
