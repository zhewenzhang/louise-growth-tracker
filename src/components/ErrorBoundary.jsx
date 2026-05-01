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
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-2xl mb-2">😔 應用出錯了</p>
          <p className="text-white/50 mb-4">{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="lg px-6 py-2 text-rose hover:bg-white/10"
          >
            刷新頁面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
