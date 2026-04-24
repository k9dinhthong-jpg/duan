import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep a useful log in development while showing a safe fallback UI.
    console.error("Unhandled rendering error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="container" style={{ padding: "24px 0" }}>
          <h1>Đã xảy ra lỗi hiển thị</h1>
          <p>
            Vui lòng tải lại trang. Nếu lỗi vẫn tiếp diễn, hãy liên hệ đội hỗ
            trợ.
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
