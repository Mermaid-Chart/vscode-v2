import { useState } from 'react';
import styles from './list-diagrams.module.css';
import ChevronRight from '../../assets/icons/dark/chevron-right.svg';
import ChevronDown from '../../assets/icons/dark/chevron-down.svg';
import Trash from '../../assets/icons/dark/trash.svg';
import Add from '../../assets/icons/dark/add.svg';
import Edit from '../../assets/icons/dark/edit.svg';
import type { Project } from './types';
import { vscode } from '../../utilities/vscode';

interface ProjectItemProps {
  project: Project;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleAction = (
    action: 'deleteDiagram' | 'updateDiagram' | 'addDiagram',
    diagramID: string,
    title?: string,
  ) => {
    vscode.postMessage({
      command: action,
      data: diagramID,
      title,
    });
  };
  return (
    <div>
      <div
        className={styles.flexContainer}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <img
          width={16}
          height={16}
          src={isExpanded ? ChevronDown : ChevronRight}
          alt=">"
        />
        <div>{project.title}</div>
      </div>
      {isExpanded && project.documents.length > 0 && (
        <ul className={styles.listContainer}>
          {project.documents.map((document) => (
            <li key={document.documentID} className={styles.listItem}>
              <span className={styles.listItemTitle}>{document.title}</span>
              <div className={styles.actionsContainer}>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    handleAction(
                      'deleteDiagram',
                      document.documentID,
                      document.title,
                    )
                  }
                >
                  <img width={16} height={16} src={Trash} alt="*" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    handleAction('updateDiagram', document.documentID)
                  }
                >
                  <img width={16} height={16} src={Edit} alt="*" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    handleAction('addDiagram', document.documentID)
                  }
                >
                  <img width={16} height={16} src={Add} alt="*" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectItem;
