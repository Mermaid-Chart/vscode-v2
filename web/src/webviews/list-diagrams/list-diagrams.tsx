import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useEffect, useState } from 'react';
import { vscode } from '../../utilities/vscode';
import styles from './list-diagrams.module.css';
import { Project } from './types';
import ProjectItem from './project';
import ProgressBar from './progress-bar';

const ListDiagrams = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'isLoading':
          setIsLoading(true);
          break;
        case 'projectsData':
          setProjects(message.data);
          setIsLoading(false);
          break;
        default:
          console.warn(`Unhandled message: ${message.command}`);
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    vscode.postMessage({
      command: 'getProjectsData',
    });
  }, []);

  return (
    <>
      <ProgressBar loading={isLoading} />
      <div className={styles.buttonContainer}>
        <VSCodeButton
          style={{ width: '100%' }}
          onClick={() => vscode.postMessage({ command: 'createNewDiagram' })}
        >
          New Diagram
        </VSCodeButton>
      </div>
      <div className={styles.projectContainer}>
        {projects.map((project) => (
          <ProjectItem project={project} />
        ))}
      </div>
    </>
  );
};

export default ListDiagrams;
