import './progress-bar.css';

interface ProgressBarProps {
  loading: boolean;
}

const ProgressBar = ({ loading }: ProgressBarProps) => {
  return (
    <div
      className="monaco-progress-container active infinite infinite-long-running"
      role="progressbar"
    >
      <div
        className="progress-bit"
        style={{
          backgroundColor: 'var(--vscode-progressBar-background)',
          width: '2%',
          opacity: loading ? 1 : 0,
        }}
      />
    </div>
  );
};

export default ProgressBar;
