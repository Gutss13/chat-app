import React from 'react';
import search_image from '../Images/search_icon.png';

function ChatSearch(props) {
  const handleChatSearchEnter = (e) => {
    const searchResultsNodelistCopy = [];
    if (e.target.parentNode.parentNode.nextSibling) {
      e.target.parentNode.parentNode.nextSibling.childNodes.forEach(
        (element) => {
          if (
            element.lastChild &&
            element.lastChild.firstChild &&
            element.lastChild.firstChild.lastChild &&
            element.lastChild.firstChild.lastChild.textContent
              .toLowerCase()
              .includes(props.chatSearchInput.current.value.toLowerCase())
          ) {
            searchResultsNodelistCopy.push(
              element.lastChild.firstChild.lastChild
            );
          } else if (
            element.lastChild &&
            element.lastChild.firstChild &&
            element.lastChild.firstChild.firstChild &&
            element.lastChild.firstChild.firstChild.textContent
              .toLowerCase()
              .includes(props.chatSearchInput.current.value.toLowerCase())
          ) {
            searchResultsNodelistCopy.push(
              element.lastChild.firstChild.firstChild
            );
          }
        }
      );
      props.setSearchResultsNodelist([...searchResultsNodelistCopy]);
      if (searchResultsNodelistCopy !== 0) {
        searchResultsNodelistCopy[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        searchResultsNodelistCopy[0].focus({
          preventScroll: true,
        });
        props.setSearchResultsIndex({
          length: searchResultsNodelistCopy.length - 1,
          current: 0,
        });
      }
    }
  };
  const handleChatSearchClick = (e) => {
    const searchResultsNodelistCopy = [];
    e.preventDefault();
    if (e.target.parentNode.parentNode.parentNode.nextSibling) {
      e.target.parentNode.parentNode.parentNode.nextSibling.childNodes.forEach(
        (element) => {
          if (
            element.lastChild &&
            element.lastChild.firstChild &&
            element.lastChild.firstChild.lastChild &&
            element.lastChild.firstChild.lastChild.textContent
              .toLowerCase()
              .includes(props.chatSearchInput.current.value.toLowerCase())
          ) {
            searchResultsNodelistCopy.push(
              element.lastChild.firstChild.lastChild
            );
          } else if (
            element.lastChild &&
            element.lastChild.firstChild &&
            element.lastChild.firstChild.firstChild &&
            element.lastChild.firstChild.firstChild.textContent
              .toLowerCase()
              .includes(props.chatSearchInput.current.value.toLowerCase())
          ) {
            searchResultsNodelistCopy.push(
              element.lastChild.firstChild.firstChild
            );
          }
        }
      );
      props.setSearchResultsNodelist([...searchResultsNodelistCopy]);
      if (searchResultsNodelistCopy.length !== 0) {
        searchResultsNodelistCopy[0].scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        searchResultsNodelistCopy[0].focus({
          preventScroll: true,
        });
        props.setSearchResultsIndex({
          length: searchResultsNodelistCopy.length - 1,
          current: 0,
        });
      }
    }
  };
  return (
    <>
      <div className="chatSearch">
        {!!props.searchResultsNodelist.length && (
          <div
            className="close"
            onClick={() => {
              props.setSearchResultsNodelist([]);
              props.setSearchResultsIndex({ length: 0, current: 0 });
            }}
          ></div>
        )}
        <input
          type="text"
          id="chatSearchInputId"
          className="chatSearchTerm"
          placeholder="Search chat"
          ref={props.chatSearchInput}
          onKeyDown={(e) => {
            if (props.receiver) {
              if (e.key === 'Enter') {
                handleChatSearchEnter(e);
              }
            }
          }}
        />
        <button
          type="submit"
          className="chatSearchButton"
          onClick={(e) => {
            handleChatSearchClick(e);
          }}
        >
          <img src={search_image} alt="" />
        </button>
      </div>
    </>
  );
}

export default ChatSearch;
