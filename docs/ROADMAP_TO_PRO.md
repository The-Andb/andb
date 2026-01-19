# 🚀 ANDB "Go Pro" Roadmap

Đây là bản kế hoạch chi tiết để nâng cấp `The Andb` từ một tool cá nhân thành một sản phẩm commercial-ready. Kế hoạch được tái cấu trúc để ưu tiên sự ổn định (Stability) và tính năng thiết yếu cho môi trường Production.

Last Updated: **Jan 2026**
Current Status: **Transitioning to Phase 2**

---

## 🏁 Phase 1: MySQL Solid Core (Release v1.0)

**Timeline:** ✅ Completed

_Mục tiêu: Đảm bảo app chạy mượt với MySQL/MariaDB, UX ngon nghẻ để release bản Community đầu tiên._

### 1.1 Integrity & Stability

- [x] **Auto-Update System**: Setup `electron-builder` để app tự động update.
- [x] **Form Validation**: Validation chặt chẽ form Connection.
- [x] **i18n Completeness**: Đảm bảo không còn key nào bị thiếu.

### 1.2 UX Polish

- [x] **Dashboard Revamp**: Quick Actions, Recent Activity.
- [x] **Data Type Select**: Dropdown chọn loại DB (Hiện tại disable Postgres/SQLite).

---

## �️ Phase 2: MySQL Deep Dive & Architecture Hardening

**Timeline:** 3 Weeks (Jan 20 - Feb 10, 2026)

_Mục tiêu: "Deep before Wide". Thay vì vội vã qua Postgres, ta sẽ hoàn thiện 100% tính năng cho MySQL để bán được cho MySQL Experts trước._

### Week 1: Advanced Objects Support

- [ ] **Stored Procedures & Functions**:
  - [ ] Parser để tách và hiển thị body của Procedure/Function.
  - [ ] Logic so sánh (Compare) diff cho Procedure.
- [ ] **Triggers & Events**:
  - [ ] Support Trigger DDL.
  - [ ] Support Scheduled Events (MySQL).
- [ ] **Views**: Hoàn thiện logic view dependencies (View A gọi View B).

### Week 2: Core Refactoring (The Abstraction)

- [ ] **Abstract Core Engine**:
  - [ ] Refactor code hiện tại đang dính chặt với `mysql` driver.
  - [ ] Tạo interface `DatabaseAdapter` chuẩn chỉnh (Chuẩn bị cho Postgres ở Phase 3).
  - [ ] Tách biệt hoàn toàn UI và Electron IPC logic.

### Week 3: Performance & Reliability

- [ ] **Large Scale Test**:
  - [ ] Test với 5,000+ tables (Giả lập môi trường Enterprise).
  - [ ] Tối ưu Virtual Scroll cho Tree View và Data Grid.
- [ ] **Smart Sync**:
  - [ ] Cải thiện thuật toán diff để giảm false-positive.

---

## � Phase 3: The PostgreSQL Expansion

**Timeline:** 3 Weeks (Feb 11 - Mar 05, 2026)

_Mục tiêu: Khi Core đã vững (Phase 2), việc plug thêm Postgres sẽ an toàn và ít bug hơn._

### 3.1 Core Adaptation

- [ ] **Postgres Adapter Implementation**: Implement interface đã define ở Phase 2.
- [ ] **Schema Support**: Xử lý hierarchy `Database > Schema > Table`.
- [ ] **Type Mapping**: Map các type đặc thù (JSONB, UUID, Array).

### 3.2 Connectivity & Security 🔐

- [ ] **SSH Tunneling**: Implement `ssh2` connector.
- [ ] **Transaction Guard**: Auto-commit OFF cho Production connections.

---

## 💎 Phase 4: Commercial & Enterprise (Bản thu tiền) 🔐

**Timeline:** March 2026 onwards

_Mục tiêu: Giải quyết các bài toán quy mô lớn, dữ liệu phức tạp và làm việc nhóm. Toàn bộ module này là Closed Source._

### 4.0 Architecture Scalability

- [ ] **Plugin/Module Architecture**: Thiết kế Dynamic Modules loading cho các tính năng Pro (để dễ dàng tách License).
- [ ] **Virtual Scrolling**: Implement `ag-grid` hoặc `tanstack-virtual` cho Data Grid (Handle 1M+ rows).

### 4.1 Data Management Tools 🔐

- [ ] **Data Compare**:
  - [ ] UI chọn Source Table & Target Table.
  - [ ] Logic compare primary key & row hash.
- [ ] **Seed Data Generator**: Generate dummy data (Faker.js integration).

### 4.2 Advanced Migration 🔐

- [ ] **Drift Detection**: Snapshot schema hiện tại -> JSON. Compare JSON cũ & mới.
- [ ] **Rollback Assistant**: Simple text replacement regex để tạo script đảo ngược (Best effort).

### 4.3 Collaboration 🔐

- [ ] **Shared Configuration**:
  - [ ] Export Connection -> Encrypted File.
  - [ ] Import Connection flow.

---

## 🛠 Tech Tasks (Ongoing Maintenance)

- [ ] **Refactor Architecture**: Tiếp tục tách code Vue component khỏi logic gọi DB trực tiếp.
- [ ] **Unit Tests**: Add test cho `PostgresAdapter` mới viết.
