import React from 'react';
import './FolderList.scss';
import SolidIcon from '../Icon/solidIcons/index';
function FolderList({ className, backgroundColor, disabled, RightIcon, LeftIcon, children, ...restProps }) {
  return (
    <button
      {...restProps}
      className={`tj-list-item  ${className} ${disabled && `tj-list-item-disabled`}`}
      style={backgroundColor && { backgroundColor }}
    >
      <div>
        {LeftIcon && (
          <span>
            <SolidIcon name={LeftIcon} />
          </span>
        )}
        {children}
      </div>

      {RightIcon && (
        <div className="tj-list-item-icon">
          {RightIcon ? (
            <SolidIcon name={RightIcon} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.833 9.91667C12.833 9.27233 13.3553 8.75 13.9997 8.75C14.644 8.75 15.1663 9.27233 15.1663 9.91667C15.1663 10.561 14.644 11.0833 13.9997 11.0833C13.3553 11.0833 12.833 10.561 12.833 9.91667ZM12.833 14C12.833 13.3557 13.3553 12.8333 13.9997 12.8333C14.644 12.8333 15.1663 13.3557 15.1663 14C15.1663 14.6443 14.644 15.1667 13.9997 15.1667C13.3553 15.1667 12.833 14.6443 12.833 14ZM12.833 18.0833C12.833 17.439 13.3553 16.9167 13.9997 16.9167C14.644 16.9167 15.1663 17.439 15.1663 18.0833C15.1663 18.7277 14.644 19.25 13.9997 19.25C13.3553 19.25 12.833 18.7277 12.833 18.0833Z"
                fill={!disabled ? `#11181C` : `#C1C8CD`}
              />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}

export default FolderList;
