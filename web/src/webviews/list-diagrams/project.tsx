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

interface ActionDataTypes {
  action: 'viewDiagram' | 'deleteDiagram' | 'updateDiagram' | 'addDiagram';
  diagramID: string;
  title?: string;
  event: React.MouseEvent;
}

const ProjectItem = ({ project }: ProjectItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const handleAction = ({
    action,
    diagramID,
    title,
    event,
  }: ActionDataTypes) => {
    event.stopPropagation();
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
          {project.documents.map(({ documentID, title }) => (
            <li
              key={documentID}
              className={styles.listItem}
              onClick={(event) =>
                handleAction({
                  action: 'viewDiagram',
                  diagramID: documentID,
                  event,
                })
              }
            >
              <span className={styles.listItemTitle}>{title}</span>
              <div className={styles.actionsContainer}>
                <button
                  className={styles.actionButton}
                  onClick={(event) =>
                    handleAction({
                      action: 'deleteDiagram',
                      diagramID: documentID,
                      title,
                      event,
                    })
                  }
                >
                  <img width={16} height={16} src={Trash} alt="*" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={(event) =>
                    handleAction({
                      action: 'updateDiagram',
                      diagramID: documentID,
                      title,
                      event,
                    })
                  }
                >
                  <img width={16} height={16} src={Edit} alt="*" />
                </button>
                <button
                  className={styles.actionButton}
                  onClick={(event) =>
                    handleAction({
                      action: 'addDiagram',
                      diagramID: documentID,
                      title,
                      event,
                    })
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
