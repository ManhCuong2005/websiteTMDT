import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { money } from "../services/format";
import { Icon } from "./Icons";
import ProductVisual from "./ProductVisual";

const SESSION_KEY = "banhang_advisor_session";
const welcomeMessage = {
  role: "model",
  content:
    "Xin chào, mình là trợ lý tư vấn của Minh Phát. Bạn đang cần chọn máy lọc, lõi thay thế hay thiết bị kiểm tra nước?",
  products: [],
};
const starterReplies = [
  "Nhà 4 người nên chọn máy nào?",
  "Tư vấn lõi lọc cần thay",
  "Ngân sách dưới 6 triệu",
];

export default function AdvisorWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [quickReplies, setQuickReplies] = useState(starterReplies);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open || historyLoaded) return;
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) {
      setHistoryLoaded(true);
      return;
    }
    api
      .get(`/advisor/conversations/${sessionToken}`)
      .then((response) => {
        if (response.data.messages?.length) {
          setMessages(response.data.messages);
          setQuickReplies([]);
        }
      })
      .catch(() => localStorage.removeItem(SESSION_KEY))
      .finally(() => setHistoryLoaded(true));
  }, [open, historyLoaded]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    });
  }, [messages, busy, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text = input) => {
    const message = text.trim();
    if (!message || busy) return;

    const userMessage = { role: "user", content: message, products: [] };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setQuickReplies([]);
    setBusy(true);

    try {
      const response = await api.post("/advisor/chat", {
        sessionToken: localStorage.getItem(SESSION_KEY),
        message,
      });
      localStorage.setItem(SESSION_KEY, response.data.sessionToken);
      setMessages((current) => [
        ...current,
        {
          role: "model",
          content: response.data.answer,
          products: response.data.products || [],
        },
      ]);
      setQuickReplies(response.data.quickReplies || []);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "model",
          content: errorMessage(error),
          products: [],
          error: true,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const startNewConversation = () => {
    localStorage.removeItem(SESSION_KEY);
    setMessages([welcomeMessage]);
    setQuickReplies(starterReplies);
    setInput("");
    setHistoryLoaded(true);
    inputRef.current?.focus();
  };

  return (
    <>
      {open && (
        <section
          className="advisor-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Trợ lý tư vấn sản phẩm"
        >
          <header className="advisor-header">
            <span className="advisor-brand-icon">
              <Icon name="sparkles" size={18} />
            </span>
            <div>
              <strong>Tư vấn sản phẩm</strong>
              <small><i /> Trợ lý AI của Minh Phát</small>
            </div>
            <button
              type="button"
              className="advisor-header-button"
              onClick={startNewConversation}
              title="Cuộc trò chuyện mới"
              aria-label="Cuộc trò chuyện mới"
            >
              <Icon name="refresh" size={17} />
            </button>
            <button
              type="button"
              className="advisor-header-button"
              onClick={() => setOpen(false)}
              title="Đóng"
              aria-label="Đóng trợ lý"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="advisor-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div
                className={`advisor-message ${message.role === "user" ? "user" : "model"}`}
                key={`${message.role}-${index}`}
              >
                {message.role === "model" && (
                  <span className="advisor-avatar">AI</span>
                )}
                <div className="advisor-message-content">
                  <p className={message.error ? "advisor-error" : ""}>
                    {message.content}
                  </p>
                  {message.products?.length > 0 && (
                    <div className="advisor-products">
                      {message.products.map((product) => (
                        <Link
                          className="advisor-product"
                          to={`/san-pham/${product.slug}`}
                          key={product.id}
                          onClick={() => setOpen(false)}
                        >
                          <span className="advisor-product-visual">
                            <ProductVisual product={product} />
                          </span>
                          <span>
                            <small>{product.categoryName}</small>
                            <b>{product.name}</b>
                            <strong>{money(product.price)}</strong>
                          </span>
                          <Icon name="chevron" size={16} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="advisor-message model">
                <span className="advisor-avatar">AI</span>
                <div className="advisor-typing" aria-label="Đang trả lời">
                  <i /><i /><i />
                </div>
              </div>
            )}
          </div>

          {quickReplies.length > 0 && !busy && (
            <div className="advisor-quick-replies">
              {quickReplies.map((reply) => (
                <button type="button" key={reply} onClick={() => send(reply)}>
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form
            className="advisor-composer"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1200}
              placeholder="Nhập nhu cầu của bạn..."
              aria-label="Nội dung cần tư vấn"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              title="Gửi"
              aria-label="Gửi câu hỏi"
            >
              <Icon name="send" size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`floating-advisor ${open ? "active" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Đóng trợ lý tư vấn" : "Mở trợ lý tư vấn"}
        title="Tư vấn sản phẩm"
      >
        <Icon name={open ? "close" : "message"} size={24} />
        {!open && <span>AI</span>}
      </button>
    </>
  );
}
