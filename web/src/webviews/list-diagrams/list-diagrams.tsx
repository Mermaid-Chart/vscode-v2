import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';
import { useEffect, useState } from 'react';
import { vscode } from '../../utilities/vscode';
import styles from './list-diagrams.module.css';
import { Project } from './types';
import ProjectItem from './project';

const ListDiagrams = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'projectsData':
          console.log(message.data);
          setProjects(message.data);
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
