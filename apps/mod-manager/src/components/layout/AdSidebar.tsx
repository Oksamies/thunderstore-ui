import React from "react";

import imgSubtract from "../../assets/1fdff093-f332-491f-b465-b5effb12febc.svg";
import imgCubeGlow from "../../assets/8ff01662-5579-4b8d-bab8-9fca56421fc0.svg";
import imgBgHexagonGfx from "../../assets/9a8af311-15bf-4a9e-8593-d50ac8a11a03.svg";
import imgLogoGlow from "../../assets/176e778b-6c0c-438c-9b6c-1abf8f95bcaf.svg";
import imgCubeSubdued from "../../assets/63237ef8-93b0-4cf8-87bb-103b416af1a4.svg";
import imgLineHorizontal from "../../assets/75741b26-c751-4c39-bdf0-575dcc5ff7cd.svg";
import imgCubeMasked from "../../assets/a24742b9-a185-451a-97a7-13c598a84a45.svg";
import imgCubeDramatic from "../../assets/b937ed6b-eb04-479d-8cc5-d0cab6cb1944.svg";
import "./AdSidebar.css";

interface AdSidebarProps {
  className?: string;
  showTsGfx?: boolean;
}

const AdSidebar = ({ className, showTsGfx = false }: AdSidebarProps) => {
  return (
    <div className={`ad-sidebar ${className || ""}`}>
      {showTsGfx && (
        <div className="ad-sidebar__gfx-container">
          <div
            style={{
              position: "absolute",
              left: "calc(50% - 0.47px)",
              top: "calc(50% - 0.47px)",
              width: "621.1px",
              height: "621.1px",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "621.1px",
                height: "621.1px",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-22.03% -12.32% -21.97% -12.39%",
                }}
              >
                <img alt="" className="img-full" src={imgBgHexagonGfx} />
              </div>
            </div>
            <div
              style={{
                position: "absolute",
                left: "241.82px",
                top: "239.62px",
                width: "139.596px",
                height: "139.596px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "9.34px",
                  top: "0",
                  width: "120.902px",
                  height: "139.596px",
                }}
              >
                <div
                  style={{ position: "absolute", inset: "-86.61% -100.01%" }}
                >
                  <img alt="" className="img-full" src={imgCubeGlow} />
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "0",
                  top: "0",
                  width: "139.596px",
                  height: "139.596px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "139.596px",
                    height: "139.596px",
                  }}
                >
                  <img alt="" className="img-full" src={imgCubeSubdued} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "139.596px",
                    height: "139.596px",
                  }}
                >
                  <img alt="" className="img-full" src={imgCubeDramatic} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    width: "139.596px",
                    height: "139.596px",
                  }}
                >
                  <img alt="" className="img-full" src={imgCubeMasked} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "23.91px",
                    top: "-52.21px",
                    width: "91.232px",
                    height: "106.537px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "-5.67% -6.63% -9.56% -6.63%",
                    }}
                  >
                    <img alt="" className="img-full" src={imgLogoGlow} />
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "7.79px",
                    top: "17.04px",
                    width: "122.363px",
                    height: "106.071px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "0.45px",
                      top: "52.13px",
                      width: "123.12px",
                      height: "39.642px",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: "-37.16% -11.9% -38.82% -11.6%",
                      }}
                    >
                      <img
                        alt=""
                        className="img-full"
                        src={imgLineHorizontal}
                      />
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: "7.14px",
                    top: "-2.55px",
                    width: "125.307px",
                    height: "144.692px",
                  }}
                >
                  <img alt="" className="img-full" src={imgSubtract} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="ad-sidebar__content">
        <div className="ad-sidebar__text-area">
          <div className="ad-sidebar__info-block">
            <div className="ad-sidebar__description">
              <p>Thunderstore development is made possible with ads.</p>
              <p>&nbsp;</p>
              <p>Get premium to remove all ads, and more!</p>
            </div>
            <a
              className="ad-sidebar__premium-btn"
              href="https://www.thunderstore.io/premium"
              target="_blank"
              rel="noreferrer"
            >
              Get Premium
            </a>
          </div>
        </div>
      </div>
      <div className="ad-sidebar__remove-ads">
        <button className="ad-sidebar__remove-btn">Remove ads</button>
      </div>
    </div>
  );
};

export default AdSidebar;
