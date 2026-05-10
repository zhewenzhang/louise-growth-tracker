import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('應用錯誤:', error);
    console.error('錯誤信息:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
          <p className="text-2xl mb-2">😔 應用出錯了</p>
          <p className="mb-4" style={{ opacity: 0.6 }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn"
          >
            🔄 刷新頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
