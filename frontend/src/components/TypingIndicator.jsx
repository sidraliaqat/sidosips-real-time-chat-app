/**
 * Renders "Ahmad is typing..." / "Ahmad and Ayesha are typing..." /
 * "Ahmad and 2 others are typing..." based on the current typing users map.
 * Props: typingUsers = { [userId]: userName }
 */
export default function TypingIndicator({ typingUsers = {} }) {
  const names = Object.values(typingUsers);
  if (names.length === 0) {
    return <div className="typing-indicator" />;
  }

  let text;
  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else {
    text = `${names[0]} and ${names.length - 1} others are typing`;
  }

  return (
    <div className="typing-indicator">
      <span>{text}</span>
      <span className="typing-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
