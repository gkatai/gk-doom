/**
 * Walk the BSP tree front-to-back from the player's position,
 * invoking the callback for each SSector index encountered.
 *
 * @param {import('./parse-map.js').BspNode[]} nodes
 * @param {number} playerX
 * @param {number} playerY
 * @param {(ssectorIndex: number) => boolean} callback
 *   Return false to halt traversal early.
 * @returns {boolean} false if traversal was halted, true if completed
 */
function traverseBsp(nodes, playerX, playerY, callback) {
  /**
   * @param {{ isSSector: boolean, index: number }} child
   * @returns {boolean} false if halted, true if completed
   */
  function visit(child) {
    if (child.isSSector) {
      return callback(child.index);
    }

    const node = nodes[child.index];

    // Determine which side the player is on via cross product:
    // cross > 0  → player is on the right side → right child is near
    // cross <= 0 → player is on the left side  → left child is near
    const cross =
      (playerX - node.x) * node.dy - (playerY - node.y) * node.dx;
    const nearChild = cross > 0 ? node.rightChild : node.leftChild;
    const farChild = cross > 0 ? node.leftChild : node.rightChild;

    if (!visit(nearChild)) return false;
    if (!visit(farChild)) return false;
    return true;
  }

  // Entry point: root is always the last node
  return visit({ isSSector: false, index: nodes.length - 1 });
}

export { traverseBsp };
