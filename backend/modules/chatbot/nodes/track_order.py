"""
nodes/track_order.py
--------------------
Agente especializado en rastreo de pedidos.
Extrae el ID del pedido, consulta la base de datos y formatea la respuesta.
"""
from __future__ import annotations

import logging

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from ..chatbot_state import GraphState
from ..chatbot_tools import track_order
from ..utils import build_lc_history, stream_and_collect

logger = logging.getLogger(__name__)


def create_track_order_node(llm: ChatOpenAI, db: AsyncSession):
    """Factory: retorna el nodo de rastreo con LLM y DB inyectados."""

    async def track_order_node(state: GraphState) -> dict:
        user_query = state["messages"][-1].content
        logger.info("[TrackOrder] ▶ Processing tracking for: '%s'", user_query)

        # 1. Extraer ID usando Regex (UUID)
        import re
        uuid_pattern = r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
        match = re.search(uuid_pattern, user_query)
        order_id = match.group(0) if match else None

        if not order_id:
            consecutive_failures = 0
            for i in range(len(state["messages"]) - 2, -1, -2):
                msg = state["messages"][i]
                if msg.role == "assistant" and (
                    "Para consultar el estado de tu pedido" in msg.content
                    or "¡Claro! 🔍 Para consultar" in msg.content
                    or "¡Casi! Ese parece ser un número" in msg.content
                    or "Hmm, sigo sin reconocer ese formato" in msg.content
                ):
                    consecutive_failures += 1
                else:
                    break

            if consecutive_failures == 0:
                reply = "¡Claro! 🔍 Para consultar el estado de tu pedido, bríndame el identificador (ID) único de tu compra. Luce así: ca4f27df-7b88-4e36-9311-3ec728b9acc3 😊"
            elif consecutive_failures == 1:
                reply = "¡Casi! Ese parece ser un número de teléfono o similar, pero el código de pedido tiene un formato diferente. 😊 Debe verse así: ca4f27df-7b88-4e36-9311-3ec728b9acc3. Por favor, inténtalo de nuevo."
            elif consecutive_failures == 2:
                reply = "Hmm, sigo sin reconocer ese formato. 🤔 Recuerda que el código de pedido lo encuentras en el correo de confirmación que te enviamos. Tiene este aspecto: ca4f27df-7b88-4e36-9311-3ec728b9acc3. ¡Es tu último intento!"
            else:
                reply = "No pude reconocer el identificador. Para no darte más largas, voy a cancelar esta solicitud por ahora. 😊 Cuando tengas el código a mano, ¡con gusto te ayudo!"

            return {"reply": reply, "actions": [], "context": ""}

        # 2. Consultar BD
        db_reply = await track_order(order_id, db)

        # 3. Formatear amigablemente
        system = (
            "Eres el asistente de Zenda. Comunícale al usuario la información de rastreo de su pedido "
            "de forma cálida y profesional. La información técnica es la siguiente:\n\n"
            f"{db_reply}\n\n"
            "REGLA CRÍTICA PARA PAGOS NEQUI/MANUALES:\n"
            "Si la información dice que el estado es 'Pendiente de pago', PERO el usuario afirma que "
            "ya pagó, envió un comprobante o transfirió, tú NO DEBES confirmar el pago. "
            "Debes decirle muy amablemente algo como: '¡Muchas gracias por tu pago! Nuestro equipo "
            "administrativo está verificando la transferencia en nuestro Nequi. Una vez sea confirmada, "
            "el sistema actualizará tu pedido a Pagado automáticamente.'"
        )
        messages = [SystemMessage(content=system)] + build_lc_history(state)
        final_reply = await stream_and_collect(llm, messages, label="track_order")
        return {"reply": final_reply, "actions": [], "context": db_reply}

    return track_order_node
