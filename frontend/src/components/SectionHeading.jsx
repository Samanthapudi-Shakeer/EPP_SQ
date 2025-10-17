import React, { useState } from "react";
import { Info } from "lucide-react";
import clsx from "clsx";

const SectionHeading = ({
  as: Component = "h2",
  title,
  infoText = "Info",
  className = "",
  headingProps = {}
}) => {
  const [open, setOpen] = useState(false);
  const { className: headingClassName, ...restHeadingProps } = headingProps;

  return (
    <div className={clsx("section-heading text-black", className)}>
      <div className="section-heading-row">
        <Component
          className={clsx("section-heading-title", headingClassName)}
          {...restHeadingProps}
        >
          {title}
        </Component>
        <button
          type="button"
          className="section-heading-info-trigger"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-label={open ? "Hide info" : "Show info"}
        >
          <Info aria-hidden="true" size={18} />
          <span className="section-heading-info-trigger__label">
            {open ? "Untoggle" : "Toggle"}
          </span>
        </button>
      </div>
      {open && (
        <div className="section-heading-info" role="note">
          {infoText}
        </div>
      )}
    </div>
  );
};

export default SectionHeading;
