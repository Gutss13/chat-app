import React from 'react';

function ChatSearchNav(props) {
  return (
    <div>
      <div className="arrowContainer">
        <div
          className="arrow up"
          onClick={() => {
            if (
              props.searchResultsIndex.current ===
              props.searchResultsIndex.length
            ) {
              props.searchResultsNodelist[0].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              props.searchResultsNodelist[0].focus({
                preventScroll: true,
              });
              props.setSearchResultsIndex({
                length: props.searchResultsIndex.length,
                current: 0,
              });
            } else {
              props.searchResultsNodelist[
                props.searchResultsIndex.current + 1
              ].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              props.searchResultsNodelist[
                props.searchResultsIndex.current + 1
              ].focus({
                preventScroll: true,
              });
              props.setSearchResultsIndex({
                length: props.searchResultsIndex.length,
                current: props.searchResultsIndex.current + 1,
              });
            }
          }}
        ></div>
        <div className="chatSearchIndex">
          {props.searchResultsIndex.current + 1}/
          {props.searchResultsIndex.length + 1}
        </div>
        <div
          className="arrow down"
          onClick={() => {
            if (props.searchResultsIndex.current === 0) {
              props.searchResultsNodelist[
                props.searchResultsIndex.length
              ].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              props.searchResultsNodelist[
                props.searchResultsIndex.length
              ].focus({
                preventScroll: true,
              });
              props.setSearchResultsIndex({
                length: props.searchResultsIndex.length,
                current: props.searchResultsIndex.length,
              });
            } else {
              props.searchResultsNodelist[
                props.searchResultsIndex.current - 1
              ].scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              props.searchResultsNodelist[
                props.searchResultsIndex.current - 1
              ].focus({
                preventScroll: true,
              });
              props.setSearchResultsIndex({
                length: props.searchResultsIndex.length,
                current: props.searchResultsIndex.current - 1,
              });
            }
          }}
        ></div>
      </div>
    </div>
  );
}

export default ChatSearchNav;
